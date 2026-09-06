// classics-io.js
// 移植自 backend/scripts/classics_parser.py
// 将 txt 内容解析为经典条目列表（无 Python 的 hash_util 类，仅在内存中维护稳定 id）

function makeId(book, chapter, quote) {
  // 简化版稳定 id：书名|章节|名句 前 16 字 hash
  // 用于去重
  const raw = `${book}|${chapter}|${quote}`
  let h = 0
  for (let i = 0; i < raw.length; i++) {
    h = (h * 31 + raw.charCodeAt(i)) | 0
  }
  return `c_${(h >>> 0).toString(36)}`
}

function parseLine(line) {
  if (!line) return null
  const raw = line.trim()
  if (!raw || raw.startsWith('#')) return null

  // 中英文 | 都支持
  const parts = raw.split(/[|｜]/).map((p) => p.trim()).filter(Boolean)
  if (parts.length < 3) return null

  const book = parts[0]
  const chapter = parts[1]
  const quote = parts[2]
  const tags = parts[3]
    ? parts[3].split(/[,，]/).map((s) => s.trim()).filter(Boolean)
    : []

  if (!book || !chapter || !quote) return null

  return {
    id: makeId(book, chapter, quote),
    book,
    chapter,
    quote,
    tags,
    char_count: quote.length,
  }
}

export function parseText(text) {
  if (!text) return []
  const out = []
  const seen = new Set()
  for (const line of text.split(/\r?\n/)) {
    const rec = parseLine(line)
    if (!rec) continue
    if (seen.has(rec.id)) continue
    seen.add(rec.id)
    out.push(rec)
  }
  return out
}

export function toLine(c) {
  const tags = (c.tags || []).join(',')
  return `${c.book}|${c.chapter}|${c.quote}|${tags}`
}

export function exportText(classics, headerComment = '# 此刻 - 典籍库\n# 格式：书名|章节|名句|标签1,标签2') {
  const lines = [headerComment]
  for (const c of classics) lines.push(toLine(c))
  return lines.join('\n') + '\n'
}

export { makeId }
