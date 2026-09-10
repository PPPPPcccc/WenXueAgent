// tests/test_rag_integration.mjs
// 测试 JS RAG matcher 与 chat.mjs 的集成

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import {
  RagMatcher,
  RotationLog,
  loadEmbeddings,
  mmrSelect,
} from '../lib/rag_matcher.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const classics = JSON.parse(
  readFileSync(path.join(__dirname, '..', 'public', 'data', 'classics.json'), 'utf-8')
)

console.log(`\n=== 集成测试（DB: ${classics.length} 条）===\n`)

// ============================================================
// 1. RotationLog
// ============================================================

console.log('--- RotationLog ---')
const log = new RotationLog(30)
log.record(['a', 'b'])
log.record(['c'])
console.log(`  penalty('a' 最早): ${log.getPenalty('a').toFixed(3)}`)
console.log(`  penalty('b'): ${log.getPenalty('b').toFixed(3)}`)
console.log(`  penalty('c' 最新): ${log.getPenalty('c').toFixed(3)}`)
console.log(`  penalty('x' 未出现): ${log.getPenalty('x').toFixed(3)}`)
const ok1 = log.getPenalty('c') < log.getPenalty('a') < 0
console.log(`  ${ok1 ? '✓' : '✗'} c 扣分 > a 扣分\n`)

// ============================================================
// 2. MMR 算法
// ============================================================

console.log('--- MMR ---')
// 构造 5 个向量：两两相似度都不同
const D = 4
const testEmbs = new Float32Array([
  1, 0, 0, 0,    // idx 0
  0.9, 0.1, 0, 0,// idx 1 跟 0 极相似
  0, 0, 1, 0,    // idx 2 跟 0 正交
  0, 0, 0, 1,    // idx 3 正交
  0.5, 0.5, 0, 0,// idx 4 部分相似
])
const sims = [0.9, 0.85, 0.7, 0.5, 0.4]

const picked1 = mmrSelect(sims, testEmbs, 3, 0.95, D)
const picked2 = mmrSelect(sims, testEmbs, 3, 0.2, D)
console.log(`  λ=0.95 偏相关：选 [${picked1.join(', ')}]`)
console.log(`  λ=0.20 偏多样：选 [${picked2.join(', ')}]`)
// 多样性 = 两两最小距离
const div = (picked, embs, D) => {
  let min = Infinity
  for (let i = 0; i < picked.length; i++) {
    for (let j = i + 1; j < picked.length; j++) {
      const a = picked[i], b = picked[j]
      let dot = 0
      for (let k = 0; k < D; k++) dot += embs[a * D + k] * embs[b * D + k]
      min = Math.min(min, 1 - dot)
    }
  }
  return min
}
const div1 = div(picked1, testEmbs, D)
const div2 = div(picked2, testEmbs, D)
console.log(`  λ=0.95 多样性: ${div1.toFixed(3)} (两两最小距离)`)
console.log(`  λ=0.20 多样性: ${div2.toFixed(3)} (两两最小距离)`)
const ok2 = div2 >= div1
console.log(`  ${ok2 ? '✓' : '✗'} 低 λ 多样性 >= 高 λ 多样性\n`)

// ============================================================
// 3. RagMatcher 完整流程
// ============================================================

console.log('--- RagMatcher ---')

// 给每个 classic 一个 id
for (let i = 0; i < classics.length; i++) {
  if (!classics[i].id) {
    classics[i].id = `${classics[i].book}_${classics[i].chapter}_${classics[i].quote.slice(0, 8)}_${i}`
  }
}

// 模拟 DashScope embedding（随机单位向量，仅用于测试流程）
const N = classics.length
const dim = 64
const embs = new Float32Array(N * dim)
// 用 hash 让同 quote 得到同向量（确定性）
for (let i = 0; i < N; i++) {
  let h = 5381
  const text = classics[i].quote
  for (let k = 0; k < text.length; k++) {
    h = ((h << 5) + h + text.charCodeAt(k)) | 0
  }
  // 用 hash 填充 64 维
  for (let k = 0; k < dim; k++) {
    h = ((h << 5) + h + k) | 0
    embs[i * dim + k] = ((h >>> 0) / 4294967296 - 0.5) * 0.1
  }
  // L2 normalize
  let norm = 0
  for (let k = 0; k < dim; k++) norm += embs[i * dim + k] ** 2
  norm = Math.sqrt(norm)
  if (norm > 1e-12) for (let k = 0; k < dim; k++) embs[i * dim + k] /= norm
}

const matcher = new RagMatcher(classics, { embeddings: embs, dim })
matcher.embedQuery = (q) => {
  // 同样用 hash 生成
  const out = new Float32Array(dim)
  let h = 5381
  for (let k = 0; k < q.length; k++) {
    h = ((h << 5) + h + q.charCodeAt(k)) | 0
  }
  for (let k = 0; k < dim; k++) {
    h = ((h << 5) + h + k) | 0
    out[k] = ((h >>> 0) / 4294967296 - 0.5) * 0.1
  }
  let norm = 0
  for (let k = 0; k < dim; k++) norm += out[k] ** 2
  norm = Math.sqrt(norm)
  if (norm > 1e-12) for (let k = 0; k < dim; k++) out[k] /= norm
  return out
}

const log2 = new RotationLog(40)

// 5 次同输入，统计多样性
const inputs = ['考试', '我孤独', '迷茫', '工作压力']
for (const inp of inputs) {
  const all = new Set()
  const t0 = performance.now()
  for (let i = 0; i < 5; i++) {
    const r = matcher.select(inp, {
      k: 8, lambdaParam: 0.65,
      rotationLog: log2, rotationPenalty: 0.3,
      perBookQuota: 3,
    })
    for (const c of r) all.add(c.id)
  }
  const dt = performance.now() - t0
  console.log(`  "${inp}" 5 次累计 ${all.size} 条不同 (${(dt / 5).toFixed(1)} ms/次)`)
}

// ============================================================
// 4. 性能
// ============================================================

console.log('\n--- 性能 ---')
const t0 = performance.now()
for (let i = 0; i < 20; i++) {
  matcher.select('我很焦虑', { k: 16, lambdaParam: 0.65, rotationLog: log2, rotationPenalty: 0.3, perBookQuota: 3 })
}
const avg = (performance.now() - t0) / 20
console.log(`  单次 select: ${avg.toFixed(1)} ms (DB ${N} 条)`)

// ============================================================
// 5. 总结
// ============================================================

console.log(`\n=== 总结 ===`)
const allOk = ok1 && ok2 && avg < 500
console.log(`  ${ok1 ? '✓' : '✗'} RotationLog 算法正确`)
console.log(`  ${ok2 ? '✓' : '✗'} MMR 多样性 vs λ`)
console.log(`  ${avg < 500 ? '✓' : '✗'} 性能 < 500ms`)
console.log(`  ${allOk ? '✅ 全部通过' : '❌ 有失败'}\n`)
process.exit(allOk ? 0 : 1)
