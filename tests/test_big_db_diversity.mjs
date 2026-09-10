// test_big_db_diversity.mjs
// 测试新数据库（11,764 条）下，matcher 的多样性表现

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import {
  selectClassics as selectV2,
  RotationLog,
} from '../src/lib/improved_matcher.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const classics = JSON.parse(
  readFileSync(path.join(__dirname, '..', 'public', 'data', 'classics.json'), 'utf-8')
)

// 复刻原 matcher 用于对比
function tagMatchesOld(c, tag) {
  const tags = c.tags || []
  return tags.includes(tag) || tags.some((t) => t.includes(tag) || tag.includes(t))
}
const KEYWORDS = {
  '考试': ['坚持', '积累', '勤勉', '学习'],
  '紧张': ['平和', '自我', '自信'],
  '焦虑': ['平和', '自我'],
  '失恋': ['平和', '自省', '志向'],
  '工作': ['担当', '价值', '志向'],
  '压力': ['平和', '担当'],
  '失意': ['担当', '志向', '坚持'],
  '自卑': ['谦逊', '自信', '修养'],
  '迷茫': ['志向', '自我', '价值'],
  '难过': ['平和', '自省'],
  '孤独': ['平和', '自我'],
  '失败': ['坚持', '担当', '志向'],
  '悲伤': ['平和', '自省'],
  '愤怒': ['平和', '自省'],
  '恐惧': ['平和', '自我', '自信'],
  '疲惫': ['平和', '担当'],
}
function detectOld(text) {
  const out = []
  for (const [k, tags] of Object.entries(KEYWORDS)) {
    if (text.includes(k)) out.push(...tags)
  }
  return [...new Set(out)]
}
function selectV1(classics, userInput, limit = 10) {
  const themes = detectOld(userInput)
  const chosen = new Set()
  const out = []
  for (const tag of themes) {
    for (const c of classics) {
      if (chosen.has(c.id)) continue
      if (tagMatchesOld(c, tag)) {
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

console.log(`数据库: ${classics.length} 条\n`)

// === 测试 1: 同一输入重复 5 次的稳定性 ===
const inputs = ['考试要来了', '我很孤独', '我对未来迷茫', '我失恋了', '工作压力好大']
console.log('=== 同一输入重复 5 次 ===')
for (const inp of inputs) {
  const v1 = []
  for (let i = 0; i < 5; i++) v1.push(selectV1(classics, inp, 8))

  const log = new RotationLog(30)
  const v2 = []
  for (let i = 0; i < 5; i++) {
    const r = selectV2(classics, inp, { limit: 8, rotationLog: log, perBookQuota: 2 })
    log.record(r.map(c => c.id))
    v2.push(r)
  }

  const v1All = new Set()
  v1.forEach(r => r.forEach(c => v1All.add(c.id)))
  const v2All = new Set()
  v2.forEach(r => r.forEach(c => v2All.add(c.id)))

  console.log(`  "${inp}"`)
  console.log(`    v1(原) 5次出现 ${v1All.size}/${classics.length} (${((1 - v1All.size/classics.length)*100).toFixed(1)}% 重复)`)
  console.log(`    v2(改) 5次出现 ${v2All.size}/${classics.length} (${((1 - v2All.size/classics.length)*100).toFixed(1)}% 重复)`)
}

// === 测试 2: 不同输入的差异化 ===
console.log('\n=== 不同输入的候选差异 ===')
const inputs2 = ['考试要来了', '孤独', '迷茫', '失恋', '压力']
for (const inp of inputs2) {
  const log = new RotationLog(30)
  const r = selectV2(classics, inp, { limit: 8, rotationLog: log, perBookQuota: 2 })

  // 书分布
  const bookCounts = {}
  for (const c of r) bookCounts[c.book] = (bookCounts[c.book] || 0) + 1

  console.log(`  "${inp}" → 书分布: ${JSON.stringify(bookCounts)}`)
}

// === 测试 3: 旋转的有效性 ===
console.log('\n=== 旋转连续 10 次，逐渐展开更多条目 ===')
const log = new RotationLog(40)
let totalSeen = new Set()
for (let i = 0; i < 10; i++) {
  const r = selectV2(classics, '我很焦虑', { limit: 8, rotationLog: log, perBookQuota: 2 })
  log.record(r.map(c => c.id))
  r.forEach(c => totalSeen.add(c.id))
}
console.log(`  10 次后累计看到 ${totalSeen.size} 个不同条目（共 ${classics.length} 条）`)

// === 测试 4: LLM 视角：候选 16 条中是否覆盖多本书？===
console.log('\n=== LLM 视角：候选 16 条的书覆盖度 ===')
const testInputs = ['我很焦虑', '我失恋了', '我迷茫', '考试', '孤独']
for (const inp of testInputs) {
  const r = selectV2(classics, inp, { limit: 16, perBookQuota: 3 })
  const books = new Set(r.map(c => c.book))
  console.log(`  "${inp}" → ${books.size} 本不同书 (${[...books].join(', ')})`)
}
