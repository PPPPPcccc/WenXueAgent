// lib/chat.mjs
// 共享核心：经典匹配 + Prompt 构建 + DashScope 调用 + 响应解析
// 用于 Vercel (`api/chat.js`) 和 Cloudflare Pages (`functions/api/chat.js`)
//
// 不直接处理 req/res，由各平台 handler 适配

import { RagMatcher, RotationLog, loadEmbeddings } from './rag_matcher.mjs'

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
  // 字面包含 boost（兜底）：保证 query 字面片段匹配的典籍进入候选
  const norm = (s) => String(s).replace(/[，。？！（）()【】\[\]、，,\.\?\!]/g, '').replace(/\s+/g, '')
  const q = norm(userInput)
  if (q.length >= 2) {
    const segments = new Set()
    for (let len = Math.min(q.length, 6); len >= 2; len--) {
      for (let i = 0; i <= q.length - len; i++) segments.add(q.slice(i, i + len))
    }
    const literals = []
    for (const c of classics) {
      if (chosen.has(c.id)) continue
      if (!c.quote) continue
      const cq = norm(c.quote)
      if ([...segments].some(seg => cq.includes(seg))) {
        literals.push(c)
        chosen.add(c.id)
        if (literals.length >= 3) break
      }
    }
    out.unshift(...literals)
  }
  return out.slice(0, limit)
}

// ============================================================
// RAG：基于向量相似度 + MMR 多样性选择
// ============================================================

/** 全局 RAG matcher 缓存（每个 worker 实例一份） */
const RAG_CACHE = {
  matcher: null,
  classicsHash: '',
  rotationLog: new RotationLog(40),
  loading: null,
}

/**
 * 加载 RAG matcher。embeddings 缺失时返回 null。
 *
 * @param {Array} classics
 * @param {Object} options
 * @param {string} options.embeddingsUrl - 二进制 URL（如 '/data/classics_embeddings.f16.bin'）
 * @param {number} options.dim
 */
export async function loadRag(classics, { embeddingsUrl, dim = 1024 }) {
  const hash = classics.length + ':' + (classics[0]?.id || '')
  if (RAG_CACHE.matcher && RAG_CACHE.classicsHash === hash) return RAG_CACHE.matcher

  if (!embeddingsUrl) return null
  if (RAG_CACHE.loading) return RAG_CACHE.loading

  RAG_CACHE.loading = (async () => {
    try {
      const embeddings = await loadEmbeddings(embeddingsUrl, dim)
      const matcher = new RagMatcher(classics, { embeddings, dim })
      RAG_CACHE.matcher = matcher
      RAG_CACHE.classicsHash = hash
      return matcher
    } catch (e) {
      console.warn('[RAG] load failed, fallback to rule-based:', e.message)
      return null
    } finally {
      RAG_CACHE.loading = null
    }
  })()
  return RAG_CACHE.loading
}

/**
 * 异步调 DashScope 嵌入 API（HTTP 方式，可被 CF Workers 直接调用）。
 * 失败时返回 null。
 */
async function embedQueryDashScope(apiKey, text, dim = 1024) {
  const url = 'https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding'
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-v3',
        input: { texts: [text] },
        parameters: { dimension: dim },
      }),
    })
    if (!resp.ok) return null
    const data = await resp.json()
    return data?.output?.embeddings?.[0]?.embedding || null
  } catch {
    return null
  }
}

/**
 * 在 RAG 候选基础上，把 query 中出现的字面片段对应的典籍强行注入候选前部。
 *
 * 解决：用户 query 是短语（"伐国"/"自省"/"君子"），且 DB 中某条字面包含它时，
 * embedding 可能因为上下文偏差给较低相似度。我们用字面匹配保证最强匹配一定在候选前部。
 *
 * @param {string} userInput
 * @param {Array} classics
 * @param {Array} ragPicked - RAG 选出的候选
 * @param {number} maxInject - 最多注入条数（默认 4）
 * @returns {Array} 新的候选列表
 */
function injectLiteralMatches(userInput, classics, ragPicked, maxInject = 4) {
  if (!userInput || !classics?.length) return ragPicked
  const norm = (s) => String(s)
    .replace(/[，。？！（）()【】\[\]、，,\.\?\!]/g, '')
    .replace(/\s+/g, '')
  const query = norm(userInput)
  if (query.length < 2) return ragPicked

  // 已去重的书名/诗人名集合
  const seenBooks = new Set(ragPicked.map(c => c.book))
  const seenAuthors = new Set(
    ragPicked
      .filter(c => c.book === '唐诗三百首')
      .map(c => c.chapter?.split('·').pop())
      .filter(Boolean)
  )
  const pickedIds = new Set(ragPicked.map(c => c.id || `${c.book}|${c.quote}`))
  const injected = []

  // 收集 query 的 2~6 字片段
  const segments = new Set()
  for (let len = Math.min(query.length, 6); len >= 2; len--) {
    for (let i = 0; i <= query.length - len; i++) {
      segments.add(query.slice(i, i + len))
    }
  }

  for (const c of classics) {
    if (injected.length >= maxInject) break
    const cid = c.id || `${c.book}|${c.quote}`
    if (pickedIds.has(cid)) continue

    // 书名/诗人名去重
    if (c.book === '唐诗三百首') {
      const author = c.chapter?.split('·').pop()
      if (author && seenAuthors.has(author)) continue
    } else {
      if (seenBooks.has(c.book)) continue
    }

    const cq = norm(c.quote)
    if (!cq) continue
    for (const seg of segments) {
      if (cq.includes(seg)) {
        injected.push(c)
        pickedIds.add(cid)
        // 更新去重集合
        if (c.book === '唐诗三百首') {
          const author = c.chapter?.split('·').pop()
          if (author) seenAuthors.add(author)
        } else {
          seenBooks.add(c.book)
        }
        break
      }
    }
  }

  if (!injected.length) return ragPicked

  // 字面匹配放最前，整体再整体去重
  const merged = [...injected, ...ragPicked]
  return deduplicateForLlm(merged, maxInject + ragPicked.length)
}

/**
 * 按书名去重（唐诗按诗人名去重），保留顺序。
 * 用于在送给 LLM 之前确保 4 张卡片来自不同书/诗人。
 *
 * @param {Array} candidates - 候选列表（已按相关度排序）
 * @param {number} limit - 最多返回几条
 * @returns {Array} 去重后的列表
 */
function deduplicateForLlm(candidates, limit = 4) {
  if (!candidates?.length) return []
  const seen = new Set()
  const authorSeen = new Set()
  const result = []

  for (const c of candidates) {
    if (result.length >= limit) break

    // 唐诗三百首：按 chapter 里提取的诗人名去重
    if (c.book === '唐诗三百首') {
      // chapter 格式是 "诗题·诗人"，提取诗人部分
      const author = c.chapter?.split('·').pop() || c.book
      if (authorSeen.has(author)) continue
      authorSeen.add(author)
    } else {
      // 其他典籍：按书名去重
      if (seen.has(c.book)) continue
      seen.add(c.book)
    }

    result.push(c)
  }

  return result
}

/**
 * RAG 选择：向量相似度 + MMR 多样性 + rotation + 去重 + 字面包含 boost。
 * 失败时回退到规则匹配。
 */
export async function selectClassicsRag({ classics, userInput, apiKey, embeddingsUrl, dim = 1024, limit = 16, lambdaParam = 0.65, rotationPenalty = 0.3, perBookQuota = 3 }) {
  if (limit <= 0 || !classics?.length) return []

  // 1. 尝试加载 RAG
  const matcher = await loadRag(classics, { embeddingsUrl, dim })
  if (!matcher || !apiKey) {
    return deduplicateForLlm(selectClassics(classics, userInput, limit), limit)
  }

  // 2. 嵌入查询
  const queryEmb = await embedQueryDashScope(apiKey, userInput, dim)
  if (!queryEmb) {
    return deduplicateForLlm(selectClassics(classics, userInput, limit), limit)
  }

  // 3. 注入 embedQuery
  matcher.embedQuery = () => queryEmb

  // 4. 用 rotation log 跨调用去重，MMR 选择更多候选（给去重后留余地）
  const ragPicked = matcher.select(userInput, {
    k: 32,           // 选更多，留给去重的空间
    lambdaParam,
    rotationLog: RAG_CACHE.rotationLog,
    rotationPenalty,
    perBookQuota,
  })

  // 5. 硬去重：书名/诗人名唯一
  const deduped = deduplicateForLlm(ragPicked, limit)

  // 6. 字面包含 boost：保证强字面匹配的典籍一定在列表里（同样去重）
  return injectLiteralMatches(userInput, classics, deduped, 4)
}

// 去除常见前缀
function stripPrefix(quote) {
  if (!quote) return quote
  return quote.replace(/^(子曰|子贡问|孔子曰|孟子曰|曾子曰|有子曰)[:："]\s*/, '')
}

// 剥离解读中 LLM 自动添加的"这句话出自..."等冗余前缀
// 例：`"这句话出自《论语·学而》第一章。我们应温故知新。"` → `我们应温故知新。`
// 例：`这句话出自《论语·学而》第一章。我们应温故知新。` → `我们应温故知新。`
function stripInterpretationPrefix(text) {
  if (!text) return text
  let s = String(text).trim()
  // 去掉首尾引号（成对）
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith('"') && s.endsWith('"'))) {
    s = s.slice(1, -1).trim()
  }
  // 剥离 "这句话出自……。" "此句出自……。" "该句出自……。" "此语出自……。" 等前缀
  const prefixRe = /^(?:这句话?|此句?|该句?|此语?|此言?|这句?话?)?(?:出自|源于|来源于|典出|来自)《[^》]+》(?:第?[一二三四五六七八九十百零\d]+章?)?[，。、,.]/u
  s = s.replace(prefixRe, '').trim()
  return s
}

// 仅去掉解读外层引号，保留"这句话出自..."的前缀文字（按【软件要求.md】第三部分原样呈现）
function stripInterpretationQuotes(text) {
  if (!text) return text
  let s = String(text).trim()
  // 去掉首尾成对引号
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith('"') && s.endsWith('"')) || (s.startsWith('「') && s.endsWith('」'))) {
    s = s.slice(1, -1).trim()
  }
  return s
}

export function matchByQuote(classics, part2) {
  if (!part2 || !classics?.length) return null
  // 归一化中英文标点
  const norm = (s) => String(s)
    .replace(/[，,]/g, '，')
    .replace(/[。.?!\n]/g, '。')
    .replace(/\s+/g, '')
  const text = norm(part2)
  if (!text) return null
  for (const c of classics) {
    if (c.quote && text.includes(norm(c.quote))) return c
  }
  for (const c of classics) {
    if (!c.quote) continue
    const stripped = stripPrefix(c.quote)
    const head = stripped.slice(0, Math.min(8, stripped.length))
    if (head && text.includes(norm(head))) return c
  }
  for (const c of classics) {
    if (!c.quote || c.quote.length < 4) continue
    // 优先用剥前缀的版本做 4 字片段匹配
    const stripped = stripPrefix(c.quote)
    const source = stripped.length >= 4 ? stripped : c.quote
    for (let i = 0; i <= source.length - 4; i++) {
      const seg = source.slice(i, i + 4)
      if (seg && text.includes(norm(seg))) return c
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
  - 每条名句都必须附带一句 10-25 字的轻量解读（不可省略，不可为"无解读"）。
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
    // 格式：《书名·章节名》第X章｜解读  或  《书名》｜解读
    let source = rest, interpretation = ''
    // 优先：《书名·章节名》｜解读
    let m = rest.match(/^《(.+?)·(.+?)》[｜](.*)$/s)
    if (m) {
      const book = m[1].trim()
      const chapter = m[2].trim()
      source = `《${book}·${chapter}》`
      interpretation = m[3].trim()
    } else {
      // fallback：《书名》第X章｜解读（旧格式兼容）
      m = rest.match(/^《(.+?)》(?:第?(.+?)章)?[｜](.*)$/s)
      if (m) {
        const book = m[1].trim()
        const chapter = m[2] ? m[2].trim() : ''
        source = chapter ? `《${book}·${chapter}》` : `《${book}》`
        interpretation = m[3].trim()
      } else {
        // fallback：书名第X章｜解读（无书名号）
        m = rest.match(/^([^第]+?)第?(.+?)章[｜](.*)$/s)
        if (m) {
          source = `${m[1].trim()}·${m[2].trim()}`
          interpretation = m[3].trim()
        }
      }
    }

    // 解读中若 LLM 用 "这句话出自..." 开头 + 引号包裹，把外层引号去掉，
    // 保留"这句话出自……"的前缀（按【软件要求.md】第三部分原样呈现）。
    interpretation = stripInterpretationQuotes(interpretation)

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

export function parseResponse(raw, classics = []) {
  if (!raw) return { success: false, error: 'empty response' }

  // 尝试新格式（4 条名句，用 ｜ 分隔）
  const quotes = parseQuotesResponse(raw, classics)
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
export async function handleChat({ userInput, apiKey, model, classics, embeddingsUrl, embeddingDim = 1024, useRag = true }) {
  if (!apiKey) {
    return { status: 500, body: { error: 'DASHSCOPE_API_KEY 未配置（请在 Vercel/CF Pages 项目环境变量中设置）' } }
  }
  // 选 4 条候选（内部 RAG 选更多再去重）
  let candidates
  if (useRag) {
    candidates = await selectClassicsRag({
      classics, userInput, apiKey,
      embeddingsUrl, dim: embeddingDim,
      limit: 4,
      lambdaParam: 0.65,
      rotationPenalty: 0.3,
      perBookQuota: 3,
    })
  } else {
    candidates = deduplicateForLlm(selectClassics(classics, userInput, 32), 4)
  }
  const prompt = buildPrompt(userInput, candidates, 4)

  let raw
  try {
    raw = await callDashScope({ apiKey, model, prompt })
  } catch (e) {
    return { status: 502, body: { error: 'LLM 调用失败：' + e.message } }
  }

  const parsed = parseResponse(raw, candidates)

  if (!parsed.success || parsed.reply.quotes.length === 0) {
    // 重试
    try {
      raw = await callDashScope({ apiKey, model, prompt: prompt + '\n\n【重要】必须严格按上述格式输出，第二部分必须输出 4 条名句，每条格式：名句｜《书名·章节名》｜解读（名句不超过 30 字）' })
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
