// parser.js
// 移植自 backend/scripts/response_parser.py

const SECTION_PATTERN = /第一部分[\-—]?通用回复\s*[:：]\s*(?<part1>.+?)\s*第二部分[\-—]?典籍名句\s*[:：]\s*(?<part2>.+?)\s*第三部分[\-—]?解释\s*[:：]\s*"(?<part3>.+?)"/s

const SECTION_PATTERN_FALLBACK = /第一部分[\-—]?通用回复\s*[:：]\s*(?<part1>.+?)\s*第二部分[\-—]?典籍名句\s*[:：]\s*(?<part2>.+?)\s*第三部分[\-—]?解释\s*[:：]\s*(?<part3>.+)/s

export function parseResponse(raw) {
  if (!raw) return { success: false, error: 'empty response' }

  let m = SECTION_PATTERN.exec(raw)
  let usedFallback = false
  if (!m) {
    m = SECTION_PATTERN_FALLBACK.exec(raw)
    usedFallback = true
    if (!m) return { success: false, error: 'pattern not matched' }
  }

  let part1 = (m.groups.part1 || '').trim()
  let part2 = (m.groups.part2 || '').trim()
  let part3 = (m.groups.part3 || '').trim()
  if (usedFallback) part3 = part3.replace(/^"|"$/g, '')

  if (!part1 || !part2 || !part3) {
    return { success: false, error: 'empty field' }
  }

  return { success: true, reply: { part1, part2, part3 } }
}

export function assertValidPart3(part3) {
  if (!part3) return false
  if (!part3.startsWith('这句话出自')) return false
  if (!part3.includes('《') || !part3.includes('》')) return false
  return true
}

/**
 * 从 part3 ("这句话出自《论语·学而》。…") 中抽取「书名·章节名」
 * 返回 null 表示抽取失败。
 */
export function extractSourceFromPart3(part3) {
  if (!part3) return null
  const m = part3.match(/《([^》]+)》/)
  return m ? m[1].trim() : null
}
