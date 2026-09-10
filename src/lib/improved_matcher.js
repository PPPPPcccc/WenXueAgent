// improved_matcher.js
// 改进版经典匹配器
// 在 selectClassics 基础上解决三个问题：
//   1. 顺序敏感 → 种子洗牌（按 userInput 哈希做种子）
//   2. 高频诗句反复出现 → 旋转惩罚（最近 N 条命中过的扣分）
//   3. 同一书挤占候选 → 书内配额（每本最多 N 条）
//
// 与原 matcher.js 完全独立，可直接 import 替换

export const KEYWORD_TAGS = {
  考试: ['坚持', '积累', '勤勉', '学习'],
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

// ===== 工具函数 =====

export function detectThemes(text) {
  if (!text) return []
  const themes = []
  for (const [kw, tags] of Object.entries(KEYWORD_TAGS)) {
    if (text.includes(kw)) themes.push(...tags)
  }
  return [...new Set(themes)]
}

export function tagMatches(classic, tag) {
  const tags = classic.tags || []
  return tags.includes(tag) || tags.some((t) => t.includes(tag) || tag.includes(t))
}

// 简单 hash：djb2
export function djb2(str) {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) | 0
  }
  return h >>> 0
}

// 种子化 PRNG (mulberry32)
export function mulberry32(seed) {
  let t = seed >>> 0
  return function () {
    t = (t + 0x6D2B79F5) >>> 0
    let x = t
    x = Math.imul(x ^ (x >>> 15), x | 1)
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

// Fisher-Yates 洗牌（in place）
export function shuffleInPlace(arr, rand) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// ===== 旋转记录器（可注入） =====
//
// Usage:
//   const rotation = new RotationLog(20)
//   rotation.record([c1.id, c2.id, ...])
//   rotation.getPenalty(id) // 返回 -1.0 ~ 0.0
//
export class RotationLog {
  constructor(maxSize = 30) {
    this.maxSize = maxSize
    this.order = [] // 最近的在末尾
  }

  record(ids) {
    for (const id of ids) {
      const idx = this.order.indexOf(id)
      if (idx >= 0) this.order.splice(idx, 1)
      this.order.push(id)
      if (this.order.length > this.maxSize) this.order.shift()
    }
  }

  // 越新扣分越多；从未出现返回 0；最老的最多 -0.1
  getPenalty(id) {
    const idx = this.order.indexOf(id)
    if (idx < 0) return 0
    const n = this.order.length
    // idx=0(最老) -> 0.1, idx=n-1(最新) -> 0.3
    const recency = (idx + 1) / n
    return -0.3 * recency
  }

  reset() {
    this.order = []
  }
}

// ===== 核心选择器 =====
/**
 * 改进版选择器
 * @param {Array} classics - 全部经典
 * @param {string} userInput - 用户输入
 * @param {Object} opts
 *   - limit: 候选数量（默认 8）
 *   - rotationLog: RotationLog 实例（可选）
 *   - perBookQuota: 每本最多入选几条（默认 2）
 *   - bookBoost: 命中主题的书是否额外加权（默认 true）
 * @returns {Array} 候选 classics（已按分数排序）
 */
export function selectClassics(classics, userInput, opts = {}) {
  const {
    limit = 8,
    rotationLog = null,
    perBookQuota = 2,
    bookBoost = true,
  } = opts
  if (limit <= 0 || !classics?.length) return []

  const themes = detectThemes(userInput)
  const seed = djb2(String(userInput || '') + '|' + classics.length)
  const rand = mulberry32(seed)

  // 1. 打乱顺序（确定性的，对相同输入稳定）
  const shuffled = shuffleInPlace(classics.slice(), rand)

  // 2. 给每条打分
  const bookCount = new Map()
  const scored = shuffled.map((c) => {
    let score = 0
    // 主题命中
    let themeHit = 0
    for (const t of themes) {
      if (tagMatches(c, t)) {
        themeHit++
        score += 1.0
      }
    }
    // 书的整体 boost：若候选的书本身没有出现过，加 0.3
    if (bookBoost && themeHit === 0 && themes.length > 0 && bookCount.has(c.book)) {
      score -= 0.2
    }
    // 旋转惩罚
    if (rotationLog) score += rotationLog.getPenalty(c.id)
    // 微小随机扰动避免完全相同时顺序一致
    score += rand() * 0.01

    return { c, score, themeHit }
  })

  // 3. 排序：分数降序
  scored.sort((a, b) => b.score - a.score)

  // 4. 书内配额选择
  const out = []
  for (const { c } of scored) {
    if (out.length >= limit) break
    const cnt = bookCount.get(c.book) || 0
    if (cnt >= perBookQuota) continue
    out.push(c)
    bookCount.set(c.book, cnt + 1)
  }

  // 5. 若配额导致不足，从剩余里补足
  if (out.length < limit) {
    for (const { c } of scored) {
      if (out.length >= limit) break
      if (out.some((x) => x.id === c.id)) continue
      out.push(c)
    }
  }

  return out.slice(0, limit)
}

// ===== 反查（用于 part2_source）=====
// 与原 matcher.js 相同，避免改动调用方
export function matchByQuote(classics, part2Text) {
  if (!part2Text || !classics?.length) return null
  const text = String(part2Text).trim()
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
