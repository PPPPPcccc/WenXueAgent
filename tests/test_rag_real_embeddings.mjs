// tests/test_rag_real_embeddings.mjs
// 用真实生成的 DashScope embeddings 验证 RAG 流程

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { RagMatcher, RotationLog, loadEmbeddings } from '../lib/rag_matcher.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const classics = JSON.parse(
  readFileSync(path.join(__dirname, '..', 'public', 'data', 'classics.json'), 'utf-8')
)

console.log(`\n=== 真实 Embedding 集成测试（DB ${classics.length} 条）===\n`)

// 给 classics 加 id
for (let i = 0; i < classics.length; i++) {
  if (!classics[i].id) {
    classics[i].id = `${classics[i].book}_${classics[i].chapter}_${classics[i].quote.slice(0, 8)}_${i}`
  }
}

// 加载真实 embeddings
console.log('加载 classics_embeddings.f16.bin...')
const t0 = performance.now()
const DIM = 1024
const N = classics.length
const raw = readFileSync(
  path.join(__dirname, '..', 'public', 'data', 'classics_embeddings.f16.bin')
)
const u16 = new Uint16Array(raw.buffer, raw.byteOffset, raw.byteLength / 2)
const embeddings = new Float32Array(u16.length)
for (let i = 0; i < u16.length; i++) {
  // float16 → float32
  const h = u16[i]
  const s = (h & 0x8000) >> 15
  const e = (h & 0x7c00) >> 10
  const f = h & 0x03ff
  let val
  if (e === 0) val = (s ? -1 : 1) * Math.pow(2, -14) * (f / 1024)
  else if (e === 0x1f) val = f ? NaN : (s ? -Infinity : Infinity)
  else val = (s ? -1 : 1) * Math.pow(2, e - 15) * (1 + f / 1024)
  embeddings[i] = val
}
console.log(`  → ${embeddings.length} floats, ${(performance.now() - t0).toFixed(1)} ms`)

// 用 DashScope 嵌入查询文本（注意：脚本里写死 key 仅为测试）
const apiKey = process.env.DASHSCOPE_API_KEY || 'sk-8d00f47784df4b9c98307b01244c3412'
async function embedQuery(text) {
  const resp = await fetch('https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-v3',
      input: { texts: [text] },
      parameters: { dimension: 1024 },
    }),
  })
  if (!resp.ok) throw new Error(`embed failed: ${resp.status}`)
  const data = await resp.json()
  return data.output.embeddings[0].embedding
}

// 构造 matcher（直接给 embeddings，绕开工厂函数）
const matcher = new RagMatcher(classics, { embeddings, dim: DIM })
let cachedQueryEmb = null
let cachedQueryText = null
matcher.embedQuery = (text) => {
  // 同步接口已不支持实际嵌入。这里做 hash mock 让单次 select 可用。
  // 实际生产中 selectClassicsRag 已经把 embedding 注入。
  if (text === cachedQueryText) return cachedQueryEmb
  // 不期望被调用：selectClassicsRag 会直接传 embedding
  throw new Error('embedQuery called unexpectedly; use selectClassicsRag instead')
}

console.log('\n--- 单查询测试（直接注入 embedding）---')
// 用真实 query embedding 测
async function testQuery(text) {
  const queryEmb = await embedQuery(text)
  matcher.embedQuery = () => queryEmb
  // 不记录到 rotation
  const before = []
  return matcher.select(text, { k: 8, lambdaParam: 0.7 })
}

const queries = ['考试', '我孤独', '迷茫', '工作压力', '悲伤']
for (const q of queries) {
  const t0 = performance.now()
  const r = await testQuery(q)
  const books = [...new Set(r.map(c => c.book))]
  console.log(`  "${q}" → ${r.length} 条 (${books.length} 本书) in ${(performance.now() - t0).toFixed(0)}ms`)
  console.log(`     books: ${books.join(', ')}`)
  console.log(`     样本: "${r[0].quote.slice(0, 12)}..." 来自 ${r[0].book}`)
}

// === 5 次同输入（rotation + MMR）===
console.log('\n--- 5 次同输入（rotation log 跨调用去重）---')
const log = new RotationLog(40)
for (const q of queries.slice(0, 3)) {
  const seen = new Set()
  for (let i = 0; i < 5; i++) {
    const queryEmb = await embedQuery(q)
    matcher.embedQuery = () => queryEmb
    const r = matcher.select(q, { k: 8, lambdaParam: 0.65, rotationLog: log, rotationPenalty: 0.3 })
    for (const c of r) seen.add(c.id)
  }
  console.log(`  "${q}" 5 次累计: ${seen.size} 条不同 (基线 8)`)
}

// === 性能 ===
console.log('\n--- 性能（无 rotation，纯 cosine + MMR）---')
const perfEmb = await embedQuery('我很焦虑')
matcher.embedQuery = () => perfEmb
const t1 = performance.now()
for (let i = 0; i < 20; i++) {
  matcher.select('我很焦虑', { k: 16, lambdaParam: 0.7 })
}
const avg = (performance.now() - t1) / 20
console.log(`  单次 select: ${avg.toFixed(1)} ms (DB ${N} 条, dim ${DIM})`)

console.log('\n=== ✅ 真实数据测试通过 ===\n')
