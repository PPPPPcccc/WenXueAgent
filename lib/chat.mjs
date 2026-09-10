// lib/chat.mjs
// 共享核心：经典匹配 + Prompt 构建 + DashScope 调用 + 响应解析
// 用于 Vercel (`api/chat.js`) 和 Cloudflare Pages (`functions/api/chat.js`)
//
// 不直接处理 req/res，由各平台 handler 适配

export const KEYWORD_TAGS = {
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

export function selectClassics(classics, userInput, limit = 10) {
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

export function matchByQuote(classics, part2) {
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

const TEMPLATE = `【角色】
你是一位擅长用中华典籍慰藉人心的文学疗愈师。

【任务】
针对用户输入的情绪与诉求，按以下顺序产出两部分，严格遵守格式：

第一部分-通用回复（100 字以内，必须贴合用户情绪与具体输入）：
  - 给予情绪安慰、打气鼓励或备考建议。

第二部分-典籍名句（输出 4 条，来自不同作者/书籍）：
  - 你内部先从【典籍候选列表】中筛选出 4 条最相关的典籍，要求尽量来自不同作者/书籍。
  - 严格控制每条名句不超过 30 个汉字（含标点）。
  - 按以下格式输出 4 条（每条独立一行，不要编号）：

名句1｜《书名》第X章｜解读
名句2｜《书名》第X章｜解读
名句3｜《书名》第X章｜解读
名句4｜《书名》第X章｜解读

【典籍候选列表】（每行一条：编号. 书名|章节|名句|标签）
{classics_context}

【用户输入】
{user_input}

【输出格式示例】（仅作格式参考，不要复述示例）
第一部分-通用回复：…
第二部分-典籍名句：
床前明月光，疑是地上霜｜《唐诗三百首》｜以月光照应乡愁之切
海上生明月，天涯共此时｜《唐诗三百首》｜望月而念远人
露从今夜白，月是故乡明｜《杜诗》｜白露起而思亲
但愿人长久，千里共婵娟｜《苏轼词》｜愿人平安，虽远共赏一月`

export function buildPrompt(userInput, classics, limit = 16) {
  const items = classics.slice(0, limit)
  const ctx = items.length
    ? items.map((c, i) => {
        const tags = Array.isArray(c.tags) ? c.tags.join(',') : ''
        return `${i + 1}. ${c.book}|${c.chapter}|${c.quote}|${tags}`
      }).join('\n')
    : '（暂无典籍候选，请基于你的常识作答，但第二部分输出空字符串）'
  return TEMPLATE.replace('{classics_context}', ctx).replace('{user_input}', userInput.trim())
}

/**
 * 解析 LLM 返回的 4 条名句响应
 * 格式：名句｜《书名》第X章｜解读
 * 返回: Array<{quote, source, interpretation, matched}>
 */
export function parseQuotesResponse(raw, classics) {
  if (!raw) return null
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean)

  // 收集所有带 ｜ 的行作为名句行
  const quoteLines = lines.filter(l => l.includes('｜'))

  const parsed = []
  for (const line of quoteLines) {
    const parts = line.split('｜')
    if (parts.length < 2) continue
    const quote = parts[0].trim()
    const rest = parts.slice(1).join('｜').trim()

    // 解析书名章节和解读
    // 格式：《书名》第X章｜解读  或  《书名》｜解读
    let source = rest, interpretation = ''
    // 优先：《书名》第X章｜解读
    let m = rest.match(/^《(.+?)》(?:第?(.+?)章)?[｜](.*)$/s)
    if (m) {
      const book = m[1].trim()
      const chapter = m[2] ? m[2].trim() + '章' : ''
      source = `《${book}》${chapter}`
      interpretation = m[3].trim()
    } else {
      // fallback：书名第X章｜解读（无书名号）
      m = rest.match(/^([^第]+?)第?(.+?)章[｜](.*)$/s)
      if (m) {
        source = `${m[1].trim()} ${m[2].trim()}章`
        interpretation = m[3].trim()
      }
    }

    if (quote.length > 0) {
      const matched = classics?.length ? matchByQuote(classics, quote) : null
      parsed.push({ quote, source, interpretation, matched })
    }
  }
  return parsed.slice(0, 4)
}

// 旧格式兼容正则
const SECTION_RE_OLD = /第一部分[\-—]?通用回复\s*[:：]\s*(.+?)\s*第二部分[\-—]?典籍名句\s*[:：]\s*(.+?)\s*第三部分[\-—]?轻量情境解读\s*[:：]\s*"(.+?)"/s
const SECTION_RE_FALLBACK_OLD = /第一部分[\-—]?通用回复\s*[:：]\s*(.+?)\s*第二部分[\-—]?典籍名句\s*[:：]\s*(.+?)\s*第三部分[\-—]?轻量情境解读\s*[:：]\s*(.+)/s

export function parseResponse(raw) {
  if (!raw) return { success: false, error: 'empty response' }

  // 尝试新格式（4 条名句，用 ｜ 分隔）
  const quotes = parseQuotesResponse(raw, [])
  if (quotes && quotes.length >= 1) {
    const m1 = raw.match(/第一部分[\-—]?通用回复\s*[:：]\s*(.+?)(?=\s*第二部分|$)/s)
    const part1 = m1 ? m1[1].trim() : ''
    return { success: true, reply: { part1, quotes }, isNewFormat: true }
  }

  // 回退旧格式（单条名句）
  let m = raw.match(SECTION_RE_OLD)
  let usedFallback = false
  if (!m) {
    m = raw.match(SECTION_RE_FALLBACK_OLD)
    usedFallback = true
    if (!m) return { success: false, error: 'pattern not matched' }
  }
  let part1 = (m[1] || '').trim()
  let part2 = (m[2] || '').trim()
  let part3 = (m[3] || '').trim()
  if (usedFallback) part3 = part3.replace(/^"|"$/g, '')
  if (!part1 || !part2 || !part3) return { success: false, error: 'empty field' }
  return {
    success: true,
    reply: {
      part1,
      quotes: [{ quote: part2, source: part3, interpretation: part3, matched: null }],
    },
    isNewFormat: false,
  }
}

export async function callDashScope({ apiKey, model, prompt, signal }) {
  const url = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
  const body = {
    model,
    input: { messages: [{ role: 'user', content: prompt }] },
    parameters: {
      temperature: 0.8,
      max_tokens: 1200,
      top_p: 0.85,
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
    signal,
  })
  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    throw new Error(`DashScope HTTP ${resp.status}: ${text.slice(0, 200)}`)
  }
  const data = await resp.json()
  const content = data?.output?.choices?.[0]?.message?.content
  if (!content) throw new Error('DashScope 返回内容为空')
  return content
}

// 主入口 - 各平台 handler 调用
// 返回 { status, body }
export async function handleChat({ userInput, apiKey, model, classics }) {
  if (!apiKey) {
    return { status: 500, body: { error: 'DASHSCOPE_API_KEY 未配置（请在 Vercel/CF Pages 项目环境变量中设置）' } }
  }
  // 选 16 条候选，让 LLM 有足够空间挑 4 本不同书
  const candidates = selectClassics(classics, userInput, 16)
  const prompt = buildPrompt(userInput, candidates, 16)

  let raw
  try {
    raw = await callDashScope({ apiKey, model, prompt })
  } catch (e) {
    return { status: 502, body: { error: 'LLM 调用失败：' + e.message } }
  }

  const parsed = parseResponse(raw)

  if (!parsed.success || parsed.reply.quotes.length === 0) {
    // 重试
    try {
      raw = await callDashScope({ apiKey, model, prompt: prompt + '\n\n【重要】必须严格按上述格式输出，第二部分必须输出 4 条名句，每条格式：名句｜《书名》第X章｜解读（名句不超过 30 字）' })
      parsed.quotes = parseQuotesResponse(raw, candidates) || []
    } catch (e) {
      // ignore
    }
  }

  let part1 = '深呼吸，你已经很棒了。'
  let quotes = []

  if (parsed.success && parsed.reply.quotes.length > 0) {
    part1 = parsed.reply.part1 || part1
    // 用真实 classics 反查
    quotes = parseQuotesResponse(raw, candidates) || parsed.reply.quotes
    if (!quotes.length) quotes = parsed.reply.quotes
  }

  // 兜底
  if (!quotes.length) {
    quotes = [{
      quote: candidates[0]?.quote || '行胜于言',
      source: candidates[0] ? `${candidates[0].book} | ${candidates[0].chapter}` : '',
      interpretation: '这是古人的智慧。',
      matched: candidates[0] || null,
    }]
  }

  return {
    status: 200,
    body: {
      id: `srv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      user_input: userInput,
      part1,
      quotes,
      model,
      created_at: new Date().toISOString(),
    },
  }
}
