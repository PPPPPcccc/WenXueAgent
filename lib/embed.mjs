// lib/embed.mjs
// 为文本列表生成向量嵌入（调用 DashScope text-embedding-v3）

export const EMBED_URL = 'https://dashscope.aliyuncs.com/api/v1/services/embeddings/text-embedding/text-embedding'
export const EMBED_MODEL = 'text-embedding-v3'
export const EMBED_DIM = 1024
export const BATCH_SIZE = 25  // DashScope 单次最多 25 条

/**
 * 为单批文本（≤25 条）生成 embedding 向量
 * @param {string[]} texts
 * @param {string} apiKey
 * @param {number} dim
 * @returns {Promise<number[][]>} 每个文本对应一个 dim 维向量
 */
export async function embedBatch(texts, apiKey, dim = EMBED_DIM) {
  const resp = await fetch(EMBED_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBED_MODEL,
      input: { texts },
      parameters: { dimension: dim },
    }),
  })
  if (!resp.ok) {
    const body = await resp.text()
    throw new Error(`Embedding API 失败 (${resp.status}): ${body}`)
  }
  const data = await resp.json()
  return data.output.embeddings.map(e => e.embedding)
}

/**
 * 为任意数量文本生成 embedding，自动分批
 * @param {string[]} texts
 * @param {string} apiKey
 * @param {number} dim
 * @returns {Promise<number[][]>}
 */
export async function embedTexts(texts, apiKey, dim = EMBED_DIM) {
  if (!texts || texts.length === 0) return []
  const results = []
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE)
    const embeddings = await embedBatch(batch, apiKey, dim)
    results.push(...embeddings)
  }
  return results
}
