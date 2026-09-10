// lib/rag_matcher.mjs
// RAG 检索 + MMR 多样性选择（与 Python 版 backend/scripts/rag_matcher.py 对齐）
//
// 使用方式：
//   import { loadRagMatcher } from './rag_matcher.mjs'
//   const rag = await loadRagMatcher(classics, fetchEmbeddingBinary)
//   const result = rag.select('我很焦虑', { k: 16, lambda_param: 0.7 })

// ============================================================
// RotationLog（与 vercel-app/src/lib/improved_matcher.js 一致）
// ============================================================

export class RotationLog {
  constructor(maxSize = 30) {
    this.maxSize = maxSize
    this.order = [] // 越新越靠后
  }

  record(ids) {
    for (const id of ids) {
      const idx = this.order.indexOf(id)
      if (idx >= 0) this.order.splice(idx, 1)
      this.order.push(id)
      if (this.order.length > this.maxSize) this.order.shift()
    }
  }

  // 最新扣分最多，最老扣分最少
  getPenalty(id) {
    const idx = this.order.indexOf(id)
    if (idx < 0) return 0
    const n = this.order.length
    const recency = (idx + 1) / n
    return -0.3 * recency
  }

  reset() {
    this.order = []
  }
}

// ============================================================
// MMR 算法
// ============================================================

export function mmrSelect(similarities, embeddings, k, lambdaParam = 0.7, dim) {
  if (typeof dim !== 'number') {
    throw new Error('mmrSelect: dim parameter is required')
  }
  const kCand = similarities.length
  if (kCand === 0 || k === 0) return []
  const realK = Math.min(k, kCand)
  const selected = []
  const remaining = new Array(kCand).fill(0).map((_, i) => i)

  // 第一个：相似度最高
  let firstIdx = 0
  for (let i = 1; i < kCand; i++) {
    if (similarities[i] > similarities[firstIdx]) firstIdx = i
  }
  selected.push(firstIdx)
  remaining.splice(remaining.indexOf(firstIdx), 1)

  while (selected.length < realK && remaining.length > 0) {
    let bestIdx = -1
    let bestScore = -Infinity
    for (const idx of remaining) {
      const relevance = lambdaParam * similarities[idx]
      let maxDiv = -Infinity
      for (const sel of selected) {
        const sim = dotAt(embeddings, dim, idx, sel)
        if (sim > maxDiv) maxDiv = sim
      }
      const diversity = (1 - lambdaParam) * maxDiv
      const score = relevance - diversity
      if (score > bestScore) {
        bestScore = score
        bestIdx = idx
      }
    }
    if (bestIdx < 0) break
    selected.push(bestIdx)
    remaining.splice(remaining.indexOf(bestIdx), 1)
  }
  return selected
}

function dotAt(matrix, dim, i, j) {
  const offI = i * dim
  const offJ = j * dim
  let dot = 0
  for (let k = 0; k < dim; k++) {
    dot += matrix[offI + k] * matrix[offJ + k]
  }
  return dot
}

function buildSubMatrix(allEmbs, indices, dim) {
  const sub = new Float32Array(indices.length * dim)
  for (let i = 0; i < indices.length; i++) {
    const src = indices[i] * dim
    sub.set(allEmbs.subarray(src, src + dim), i * dim)
  }
  return sub
}

// ============================================================
// RagMatcher 主类
// ============================================================

export class RagMatcher {
  /**
   * @param {Array} classics - 典籍数组
   * @param {Object} options
   * @param {Float32Array} options.embeddings - 预计算的 (N × D) 向量（已 L2 normalize）
   * @param {number} options.dim - 向量维度
   */
  constructor(classics, { embeddings, dim }) {
    this.classics = classics
    this.embeddings = embeddings
    this.dim = dim
    this.idToIdx = new Map()
    classics.forEach((c, i) => {
      const id = c.id || `${c.book}|${c.chapter}|${c.quote}`
      this.idToIdx.set(id, i)
    })
  }

  /**
   * 嵌入查询文本（需子类实现或通过 embedder 注入）。
   */
  embedQuery(query) {
    throw new Error('embedQuery must be provided')
  }

  /**
   * 查询选 k 条。
   * @param {string} query
   * @param {Object} options
   * @param {number} [options.k=16]
   * @param {number} [options.lambdaParam=0.7] 越接近 1 越偏相关，越接近 0 越偏多样性
   * @param {RotationLog} [options.rotationLog]
   * @param {number} [options.rotationPenalty=0.0]  跨调用扣分力度
   * @param {number} [options.perBookQuota]  单本书最多入选项
   */
  select(query, { k = 16, lambdaParam = 0.7, rotationLog = null, rotationPenalty = 0, perBookQuota = null } = {}) {
    if (!this.classics.length || !query || !query.trim()) return []

    const qEmb = this.embedQuery(query)
    if (!qEmb || qEmb.length !== this.dim) return []

    // 1. 计算相似度
    const sims = new Float32Array(this.classics.length)
    for (let i = 0; i < this.classics.length; i++) {
      let dot = 0
      for (let j = 0; j < this.dim; j++) {
        dot += this.embeddings[i * this.dim + j] * qEmb[j]
      }
      sims[i] = dot
    }

    // 2. 候选池
    const poolSize = Math.min(Math.max(k * 4, 50), this.classics.length)
    const topIdx = topKIndices(sims, poolSize)
    // 按相似度降序
    topIdx.sort((a, b) => sims[b] - sims[a])

    // 3. rotation 扣分
    let poolSims = sims
    if (rotationLog && rotationPenalty > 0) {
      poolSims = new Float32Array(poolSize)
      for (let i = 0; i < poolSize; i++) {
        const idx = topIdx[i]
        const cid = this._idByIdx(idx)
        const penalty = cid ? rotationLog.getPenalty(cid) : 0
        poolSims[i] = sims[idx] + rotationPenalty * penalty
      }
    } else {
      poolSims = new Float32Array(poolSize)
      for (let i = 0; i < poolSize; i++) poolSims[i] = sims[topIdx[i]]
    }

    // 4. MMR 在 pool 内选 k
    let pickedLocal
    if (perBookQuota) {
      pickedLocal = mmrSelectWithQuota(
        poolSims, this.embeddings, topIdx, k, lambdaParam, perBookQuota, this.classics, this.dim
      )
    } else {
      const sub = buildSubMatrix(this.embeddings, topIdx, this.dim)
      const localIdx = mmrSelect(poolSims, sub, k, lambdaParam, this.dim)
      pickedLocal = localIdx.map(i => topIdx[i])
    }

    // 5. rotation record
    if (rotationLog) {
      rotationLog.record(pickedLocal.map(i => this._idByIdx(i)))
    }

    return pickedLocal.map(i => this.classics[i])
  }

  _idByIdx(idx) {
    const c = this.classics[idx]
    return c?.id || `${c?.book}|${c?.chapter}|${c?.quote}`
  }
}

// ============================================================
// 工具函数
// ============================================================

function topKIndices(arr, k) {
  const idx = Array.from({ length: arr.length }, (_, i) => i)
  idx.sort((a, b) => arr[b] - arr[a])
  return idx.slice(0, k)
}

function mmrSelectWithQuota(poolSims, allEmbs, topIdx, k, lambdaParam, perBookQuota, classics, dim) {
  const sub = buildSubMatrix(allEmbs, topIdx, dim)
  const pickedLocal = mmrSelect(poolSims, sub, k * 2, lambdaParam, dim)
  const pickedGlobal = pickedLocal.map(i => topIdx[i])
  const bookCount = new Map()
  const out = []
  for (const gi of pickedGlobal) {
    const c = classics[gi]
    const book = c.book
    if ((bookCount.get(book) || 0) >= perBookQuota) continue
    bookCount.set(book, (bookCount.get(book) || 0) + 1)
    out.push(gi)
    if (out.length >= k) break
  }
  return out
}

function _buildSubMatrix(allEmbs, indices) {
  const D = Math.sqrt(allEmbs.length / indices.length) | 0
  const flat = new Float32Array(indices.length * D)
  for (let i = 0; i < indices.length; i++) {
    const src = indices[i] * D
    flat.set(allEmbs.subarray(src, src + D), i * D)
  }
  return Object.assign(flat, { d: D, length: indices.length * D })
}

// ============================================================
// 二进制 embeddings 加载器
// ============================================================

/**
 * 从 URL 加载 float16 二进制 embedding 文件，转为 Float32Array。
 * 文件格式：N × D × 2 bytes (little-endian float16)，无 header
 *
 * @param {string} url
 * @param {number} dim
 * @returns {Promise<Float32Array>}
 */
export async function loadEmbeddings(url, dim) {
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`Failed to load embeddings: ${resp.status}`)
  const buf = await resp.arrayBuffer()
  const u8 = new Uint8Array(buf)
  const u16 = new Uint16Array(u8.buffer, u8.byteOffset, u8.byteLength / 2)
  const f32 = new Float32Array(u16.length)
  for (let i = 0; i < u16.length; i++) {
    f32[i] = float16ToFloat32(u16[i])
  }
  return f32
}

function float16ToFloat32(h) {
  const s = (h & 0x8000) >> 15
  const e = (h & 0x7c00) >> 10
  const f = h & 0x03ff
  if (e === 0) {
    return (s ? -1 : 1) * Math.pow(2, -14) * (f / 1024)
  } else if (e === 0x1f) {
    return f ? NaN : (s ? -Infinity : Infinity)
  }
  return (s ? -1 : 1) * Math.pow(2, e - 15) * (1 + f / 1024)
}

// ============================================================
// 工厂函数
// ============================================================

/**
 * 加载完整 RAG matcher。
 *
 * @param {Array} classics
 * @param {Object} options
 * @param {string} [options.embeddingsUrl] - 二进制 embeddings URL
 * @param {number} options.dim - 维度
 * @param {Function} options.embedQuery - 嵌入查询的函数
 */
export async function loadRagMatcher(classics, { embeddingsUrl, dim, embedQuery }) {
  if (!embeddingsUrl) {
    throw new Error('embeddingsUrl required for loadRagMatcher')
  }
  const embeddings = await loadEmbeddings(embeddingsUrl, dim)
  const matcher = new RagMatcher(classics, { embeddings, dim })
  matcher.embedQuery = embedQuery
  return matcher
}
