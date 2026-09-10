// test_perf.mjs
// 性能测试：selectClassics 在 11,764 条 DB 上的耗时

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { selectClassics, RotationLog } from '../src/lib/improved_matcher.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const classics = JSON.parse(
  readFileSync(path.join(__dirname, '..', 'public', 'data', 'classics.json'), 'utf-8')
)

const inputs = ['考试要来了', '我失恋了', '对未来迷茫', '工作压力', '我很自卑']

console.log(`\n=== selectClassics 性能测试 ===`)
console.log(`数据库: ${classics.length} 条\n`)

let totalTime = 0
const N = 50
for (const inp of inputs) {
  const log = new RotationLog(40)
  const t0 = performance.now()
  for (let i = 0; i < N; i++) {
    const r = selectClassics(classics, inp, { limit: 16, rotationLog: log, perBookQuota: 3 })
    log.record(r.map(c => c.id))
  }
  const dt = performance.now() - t0
  totalTime += dt
  console.log(`  "${inp}": ${(dt/N).toFixed(2)} ms/次 × ${N}次 = ${dt.toFixed(0)} ms`)
}

console.log(`\n平均: ${(totalTime/N/inputs.length).toFixed(2)} ms/次`)
console.log(`(100 次/天用户活跃，单次 50ms 内都可接受)`)
