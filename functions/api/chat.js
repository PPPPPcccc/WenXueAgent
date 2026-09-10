// functions/api/chat.js - Cloudflare Pages Function
// 适配 Cloudflare Workers 运行时（workerd，无 node:fs）
// 经典库通过静态资源 import 直接打包进函数

// 通过 ESM 把 classics.json 内联进函数 bundle（无需 fetch，零延迟）
import classics from '../../public/data/classics.json'
import { handleChat } from '../../lib/chat.mjs'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function jsonResponse(status, body, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json;charset=utf-8', ...CORS, ...extraHeaders },
  })
}

export async function onRequestPost(context) {
  const { request, env } = context

  let body
  try {
    body = await request.json()
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON body' })
  }

  const content = String(body?.content || '').trim()
  if (!content) return jsonResponse(400, { error: 'content 不能为空' })
  if (content.length > 500) return jsonResponse(400, { error: '内容过长（>500 字）' })

  try {
    // 把相对 URL 转为绝对 URL（Cloudflare workerd 中 fetch 不支持相对路径）
    const origin = new URL(request.url).origin
    const absEmbeddingsUrl = embeddingsUrl?.startsWith('/')
      ? `${origin}${embeddingsUrl}`
      : embeddingsUrl

    const { status, body: out } = await handleChat({
      userInput: content,
      apiKey: env.DASHSCOPE_API_KEY,
      model: env.LLM_MODEL || 'qwen-plus',
      classics,
      // RAG 配置：URL 指向 public/ 下的二进制 embeddings；缺失会自动回退到规则匹配
      embeddingsUrl: absEmbeddingsUrl,
      embeddingDim: Number(env.RAG_EMBEDDING_DIM) || 1024,
      useRag: env.RAG_ENABLED !== 'false',  // 默认启用
    })
    return jsonResponse(status, out)
  } catch (err) {
    console.error('chat handler error:', err)
    return jsonResponse(500, { error: err.message || '服务器内部错误' })
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return onRequestOptions()
  if (context.request.method !== 'POST') {
    return jsonResponse(405, { error: 'Method Not Allowed' })
  }
  return onRequestPost(context)
}
