// matcher.js
// 经典匹配算法 - 从 backend/app/services/classics_service.py 移植到 JS
//
// 1. KEYWORD_TAGS：主题 → 标签 的关键词映射
// 2. selectClassics：根据用户输入挑候选典籍
// 3. matchByQuote：在候选里反查命中的原典（用于 part2_source）

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
    if (text.includes(kw)) {
      themes.push(...tags)
    }
  }
  // 去重保持顺序
  return [...new Set(themes)]
}

function tagMatches(classic, tag) {
  const tags = classic.tags || []
  return tags.includes(tag) || tags.some((t) => t.includes(tag) || tag.includes(t))
}

export function selectClassics(classics, userInput, limit = 10) {
  if (limit <= 0 || !classics?.length) return []
  const themes = detectThemes(userInput)
  const chosenIds = new Set()
  const out = []

  // 阶段一：标签命中
  for (const tag of themes) {
    for (const c of classics) {
      if (chosenIds.has(c.id)) continue
      if (tagMatches(c, tag)) {
        chosenIds.add(c.id)
        out.push(c)
        if (out.length >= limit) break
      }
    }
    if (out.length >= limit) break
  }

  // 阶段二：补足
  if (out.length < limit) {
    for (const c of classics) {
      if (chosenIds.has(c.id)) continue
      chosenIds.add(c.id)
      out.push(c)
      if (out.length >= limit) break
    }
  }
  return out.slice(0, limit)
}

export function matchByQuote(classics, part2Text) {
  if (!part2Text || !classics?.length) return null
  const text = (part2Text || '').trim()
  if (!text) return null

  // 1. quote 完整包含 part2
  for (const c of classics) {
    if (c.quote && text.includes(c.quote)) return c
  }
  // 2. quote 前 8 字在 part2 中
  for (const c of classics) {
    if (!c.quote) continue
    const head = c.quote.slice(0, Math.min(8, c.quote.length))
    if (head && text.includes(head)) return c
  }
  // 3. quote 任意 4 字片段
  for (const c of classics) {
    if (!c.quote || c.quote.length < 4) continue
    for (let i = 0; i <= c.quote.length - 4; i++) {
      const seg = c.quote.slice(i, i + 4)
      if (seg && text.includes(seg)) return c
    }
  }
  return null
}
