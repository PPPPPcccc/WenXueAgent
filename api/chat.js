// api/chat.js
// Vercel Serverless Function - 接收 /api/chat POST 请求
// 1. 加载经典库（从 public/data/classics.json）
// 2. 候选筛选 + prompt 拼装
// 3. 调用 qwen-plus
// 4. 解析响应 + 命中典籍
// 5. 返回 JSON { part1, part2, part3, part2_source, model }

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ---- 经典匹配（与 src/lib/matcher.js 逻辑一致） ----
const KEYWORD_TAGS = {
  考试: ['坚持', '积累', '勤勉', '学而不思则罔', '学习'],
  紧张: ['平和', '自我', '自信'],
  焦虑: ['平和', '自我'],
  失恋: ['平和', '自省', '志向'],
  工作: ['担当', '价值', '志向'],
  压力: ['平和', '担当'],
  失意: ['担当', '志向', '坚持'],
  自卑: ['谦逊', '自信', '修养'],
  迷茫: ['志向', '自我', '价值'],
  难过: ['平和', '自省'],
  孤独: ['平和', '自我'],
  失败: ['坚持', '担当', '志向'],
  悲伤: ['平和', '自省'],
  愤怒: ['平和', '自省'],
  恐惧: ['平和', '自我', '自信'],
  疲惫: ['平和', '担当'],
}

function detectThemes(text) {
  if (!text) return []
  const themes = []
  for (const [kw, tags] of Object.entries(KEYWORD_TAGS)) {
    if (text.includes(kw)) themes.push(...tags)
  }
  return [...new Set(themes)]
}

function tagMatches(c, tag) {
  const tags = c.tags || []
  return tags.includes(tag) || tags.some((t) => t.includes(tag) || tag.includes(t))
}

function selectClassics(classics, userInput, limit = 10) {
  if (limit <= 0 || !classics?.length) return []
  const themes = detectThemes(userInput)
  const chosen = new Set()
  const out = []
  for (const tag of themes) {
    for (const c of classics) {
      if (chosen.has(c.id)) continue
      if (tagMatches(c, tag)) {
        chosen.add(c.id)
        out.push(c)
        if (out.length >= limit) break
      }
    }
    if (out.length >= limit) break
  }
  if (out.length < limit) {
    for (const c of classics) {
      if (chosen.has(c.id)) continue
      chosen.add(c.id)
      out.push(c)
      if (out.length >= limit) break
    }
  }
  return out.slice(0, limit)
}

function matchByQuote(classics, part2) {
  if (!part2 || !classics?.length) return null
  const text = String(part2).trim()
  if (!text) return null
  for (const c of classics) {
    if (c.quote && text.includes(c.quote)) return c
  }
  for (const c of classics) {
    if (!c.quote) continue
    const head = c.quote.slice(0, Math.min(8, c.quote.length))
    if (head && text.includes(head)) return c
  }
  for (const c of classics) {
    if (!c.quote || c.quote.length < 4) continue
    for (let i = 0; i <= c.quote.length - 4; i++) {
      const seg = c.quote.slice(i, i + 4)
      if (seg && text.includes(seg)) return c
    }
  }
  return null
}

// ---- Prompt 模板（与 src/lib/prompt.js 一致） ----
const TEMPLATE = `【角色】
你是一位擅长用中华典籍慰藉人心的文学疗愈师。

【任务】
针对用户输入的情绪与诉求，按以下顺序产出三段，严格遵守格式：

第一部分-通用回复（100 字以内，必须贴合用户情绪与具体输入）：
  - 给予情绪安慰、打气鼓励或备考建议。

第二部分-典籍名句（仅输出唯一最优匹配）：
  - 你内部先从【典籍候选列表】中筛选出 3 条最相关的典籍，给它们打分（0~10 分）。
  - 仅把分数最高的那一条名句原文输出；如果有多条并列最高，任选其一即可。
  - 不允许输出任何其它典籍、任何解释、任何编号。

第三部分-轻量情境解读（严格使用以下格式）：
  "这句话出自《XXX》第 X 章。…（不超过 60 字的解读）…"

【典籍候选列表】（每行一条：编号. 书名|章节|名句|标签）
{classics_context}

【用户输入】
{user_input}

【输出格式示例】（仅作格式参考，不要复述示例）
第一部分-通用回复：…
第二部分-典籍名句：…
第三部分-轻量情境解读：…`

function buildPrompt(userInput, classics, limit = 8) {
  const items = classics.slice(0, limit)
  const ctx = items.length
    ? items.map((c, i) => {
        const tags = Array.isArray(c.tags) ? c.tags.join(',') : ''
        return `${i + 1}. ${c.book}|${c.chapter}|${c.quote}|${tags}`
      }).join('\n')
    : '（暂无典籍候选，请基于你的常识作答，但第二部分输出空字符串）'
  return TEMPLATE.replace('{classics_context}', ctx).replace('{user_input}', userInput.trim())
}

// ---- 响应解析 ----
const SECTION_RE = /第一部分[\-—]?通用回复\s*[:：]\s*(.+?)\s*第二部分[\-—]?典籍名句\s*[:：]\s*(.+?)\s*第三部分[\-—]?轻量情境解读\s*[:：]\s*"(.+?)"/s
const SECTION_RE_FALLBACK = /第一部分[\-—]?通用回复\s*[:：]\s*(.+?)\s*第二部分[\-—]?典籍名句\s*[:：]\s*(.+?)\s*第三部分[\-—]?轻量情境解读\s*[:：]\s*(.+)/s

function parseResponse(raw) {
  if (!raw) return { success: false, error: 'empty response' }
  let m = raw.match(SECTION_RE)
  let usedFallback = false
  if (!m) {
    m = raw.match(SECTION_RE_FALLBACK)
    usedFallback = true
    if (!m) return { success: false, error: 'pattern not matched' }
  }
  let part1 = (m[1] || '').trim()
  let part2 = (m[2] || '').trim()
  let part3 = (m[3] || '').trim()
  if (usedFallback) part3 = part3.replace(/^"|"$/g, '')
  if (!part1 || !part2 || !part3) return { success: false, error: 'empty field' }
  return { success: true, reply: { part1, part2, part3 } }
}

// ---- 经典库缓存 ----
let classicsCache = null
let classicsCacheAt = 0
const CACHE_TTL_MS = 60_000 // 60s

async function loadClassics() {
  const now = Date.now()
  if (classicsCache && now - classicsCacheAt < CACHE_TTL_MS) return classicsCache
  // /var/task/api -> /var/task/public/data/classics.json
  const candidates = [
    path.join(__dirname, '..', 'public', 'data', 'classics.json'),
    path.join(process.cwd(), 'public', 'data', 'classics.json'),
    path.join('/var/task', 'public', 'data', 'classics.json'),
  ]
  let raw = null
  for (const p of candidates) {
    try {
      raw = await fs.readFile(p, 'utf-8')
      break
    } catch {
      // try next
    }
  }
  if (!raw) {
    throw new Error('经典库加载失败（public/data/classics.json 不存在）')
  }
  classicsCache = JSON.parse(raw)
  classicsCacheAt = now
  return classicsCache
}

// ---- DashScope 调用 ----
async function callDashScope({ apiKey, model, prompt }) {
  const url = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
  const body = {
    model,
    input: { messages: [{ role: 'user', content: prompt }] },
    parameters: {
      temperature: 0.7,
      max_tokens: 800,
      top_p: 0.8,
      result_format: 'message',
    },
  }
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })
  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    throw new Error(`DashScope HTTP ${resp.status}: ${text.slice(0, 200)}`)
  }
  const data = await resp.json()
  const choice = data?.output?.choices?.[0]
  const content = choice?.message?.content
  if (!content) {
    throw new Error('DashScope 返回内容为空')
  }
  return content
}

// ---- Handler ----
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }

  // 解析 body
  let body = req.body
  if (!body) {
    try {
      body = JSON.parse(await new Promise((resolve, reject) => {
        let buf = ''
        req.on('data', (c) => (buf += c))
        req.on('end', () => resolve(buf))
        req.on('error', reject)
      }))
    } catch {
      res.status(400).json({ error: 'Invalid JSON body' })
      return
    }
  }

  const content = String(body?.content || '').trim()
  if (!content) {
    res.status(400).json({ error: 'content 不能为空' })
    return
  }
  if (content.length > 500) {
    res.status(400).json({ error: '内容过长（>500 字）' })
    return
  }

  // API key
  const apiKey = process.env.DASHSCOPE_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'DASHSCOPE_API_KEY 未配置（请在 Vercel 项目 Settings → Environment Variables 设置）' })
    return
  }
  const model = process.env.LLM_MODEL || 'qwen-plus'

  try {
    const classics = await loadClassics()
    const candidates = selectClassics(classics, content, 8)
    const prompt = buildPrompt(content, candidates, 8)

    let raw
    try {
      raw = await callDashScope({ apiKey, model, prompt })
    } catch (e) {
      console.error('DashScope error:', e)
      res.status(502).json({ error: 'LLM 调用失败：' + e.message })
      return
    }

    let parsed = parseResponse(raw)
    if (!parsed.success) {
      // 重试一次：在 prompt 前加约束
      const retryPrompt = prompt + '\n\n【重要】必须严格按上述格式输出，不要加任何额外解释。'
      try {
        raw = await callDashScope({ apiKey, model, prompt: retryPrompt })
        parsed = parseResponse(raw)
      } catch (e) {
        console.error('DashScope retry error:', e)
      }
    }

    if (!parsed.success) {
      // 兜底
      const fallbackQuote = candidates[0]?.quote || '行胜于言'
      parsed = {
        success: true,
        reply: {
          part1: '深呼吸，给自己一点时间，你已经在努力了。',
          part2: fallbackQuote,
          part3: '这句话是我们的共同信念：再坚持一下，便是柳暗花明。',
        },
      }
    }

    const match = matchByQuote(candidates, parsed.reply.part2)
    const part2Source = match
      ? `${match.book} | ${match.chapter}`
      : null

    res.status(200).json({
      id: `srv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      user_input: content,
      part1: parsed.reply.part1,
      part2: parsed.reply.part2,
      part3: parsed.reply.part3,
      part2_source: part2Source,
      model,
      created_at: new Date().toISOString(),
    })
  } catch (err) {
    console.error('chat handler error:', err)
    res.status(500).json({ error: err.message || '服务器内部错误' })
  }
}
