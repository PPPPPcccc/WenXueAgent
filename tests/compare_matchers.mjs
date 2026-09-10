// compare_matchers.mjs
// 对比原 matcher 与 improved_matcher 在多个场景下的实际表现

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

// 复刻原 matcher 的行为（从 src/lib/matcher.js 移植，便于对比）
const KEYWORD_TAGS_OLD = {
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

function detectOld(text) {
  const out = []
  for (const [k, tags] of Object.entries(KEYWORD_TAGS_OLD)) {
    if (text.includes(k)) out.push(...tags)
  }
  return [...new Set(out)]
}
function tagMatchesOld(c, tag) {
  const tags = c.tags || []
  return tags.includes(tag) || tags.some((t) => t.includes(tag) || tag.includes(t))
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

function countRepeated(runs) {
  // 输入相同 N 次时，候选 id 集合的全集大小
  const all = new Set()
  for (const r of runs) for (const c of r) all.add(c.id)
  return all.size
}

const inputs = [
  '考试要来了，我好紧张，每天复习很累',
  '我和女朋友分手了，太难过了',
  '工作压力好大，每天都很焦虑',
  '我好像失败了，不知道该怎么办',
  '我最近很自卑，觉得什么都不如别人',
  '我对未来很迷茫，不知道路在何方',
  '我好孤独，身边没有能说话的人',
  '每天都很疲惫，不想再坚持了',
  '我失败了，一切都完了',
  '我很愤怒，又很悲伤',
]

console.log('\n=== 真实场景对比：10 个不同输入，每个返回 8 条候选 ===\n')

for (const inp of inputs) {
  const v1 = selectV1(classics, inp, 8)
  const log = new RotationLog(30)
  const v2 = selectV2(classics, inp, { limit: 8, rotationLog: log })

  const v1Books = {}
  for (const c of v1) v1Books[c.book] = (v1Books[c.book] || 0) + 1
  const v2Books = {}
  for (const c of v2) v2Books[c.book] = (v2Books[c.book] || 0) + 1

  console.log(`输入：${inp}`)
  console.log(`  v1(原): ${v1.map((c) => c.quote.slice(0, 8)).join(' / ')}`)
  console.log(`       书分布: ${JSON.stringify(v1Books)}`)
  console.log(`  v2(改): ${v2.map((c) => c.quote.slice(0, 8)).join(' / ')}`)
  console.log(`       书分布: ${JSON.stringify(v2Books)}`)
  console.log()
}

console.log('\n=== 同一输入重复 5 次的候选稳定性对比 ===\n')

const log = new RotationLog(30)
const samples = [
  '考试要来了',
  '我很孤独',
  '我对未来迷茫',
  '我失恋了',
]
for (const inp of samples) {
  const v1Runs = []
  for (let i = 0; i < 5; i++) v1Runs.push(selectV1(classics, inp, 8))
  const v2Runs = []
  for (let i = 0; i < 5; i++) v2Runs.push(selectV2(classics, inp, { limit: 8, rotationLog: log, perBookQuota: 2 }) || log.record(v2Runs.at(-1)?.map((c) => c.id) || []))
  // 上面 v2 记录略乱，简化为：每次选完记录
  log.reset()
  const v2Runs2 = []
  for (let i = 0; i < 5; i++) {
    const r = selectV2(classics, inp, { limit: 8, rotationLog: log, perBookQuota: 2 })
    log.record(r.map((c) => c.id))
    v2Runs2.push(r)
  }
  const v1Distinct = countRepeated(v1Runs)
  const v2Distinct = countRepeated(v2Runs2)
  console.log(`输入：${inp}`)
  console.log(`  v1: 5 次出现 ${v1Distinct}/26 个不同条目 (重复率 ${(1 - v1Distinct/26).toFixed(2)})`)
  console.log(`  v2: 5 次出现 ${v2Distinct}/26 个不同条目 (重复率 ${(1 - v2Distinct/26).toFixed(2)})`)
  console.log()
}
