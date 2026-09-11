// functions/api/chat.js - Cloudflare Pages Function
// 适配 Cloudflare Workers 运行时（workerd，无 node:fs）
// 经典库通过静态资源 import 直接打包进函数

import classics from '../../public/data/classics.json'
import { handleChat } from '../../lib/chat.mjs'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const DIM = 1024

// 静态 embeddings 缓存（按 origin 缓存）
const STATIC_EMB_CACHE = new Map()

async function loadStaticEmbeddings(origin, env) {
  if (STATIC_EMB_CACHE.has(origin)) return STATIC_EMB_CACHE.get(origin)
  const url = env.RAG_EMBEDDINGS_URL || '/data/classics_embeddings.f16.bin'
  const absUrl = url.startsWith('/') ? `${origin}${url}` : url
  const resp = await fetch(absUrl)
  if (!resp.ok) throw new Error(`加载 embeddings 失败: ${resp.status}`)
  const buf = await resp.arrayBuffer()
  const u8 = new Uint8Array(buf)
  const u16 = new Uint16Array(u8.buffer, u8.byteOffset, u8.byteLength / 2)
  const f32 = new Float32Array(u16.length)
  for (let i = 0; i < u16.length; i++) {
    const h = u16[i]
    const s = (h & 0x8000) >> 15
    const e = (h & 0x7c00) >> 10
    const f = h & 0x03ff
    if (e === 0) f32[i] = (s ? -1 : 1) * Math.pow(2, -14) * (f / 1024)
    else if (e === 0x1f) f32[i] = f ? NaN : (s ? -Infinity : Infinity)
    else f32[i] = (s ? -1 : 1) * Math.pow(2, e - 15) * (1 + f / 1024)
  }
  STATIC_EMB_CACHE.set(origin, f32)
  return f32
}

// 合并静态 embeddings（去除 removed）+ userEmbeddings
function buildMergedEmbeddings(staticClassics, staticEmb, removedIds, userEmbeddings) {
  const removed = new Set(removedIds || [])
  const total = staticClassics.length - removed.size + (userEmbeddings?.length || 0)
  const out = new Float32Array(total * DIM)
  let dst = 0
  for (let i = 0; i < staticClassics.length; i++) {
    if (removed.has(staticClassics[i].id)) continue
    out.set(staticEmb.subarray(i * DIM, (i + 1) * DIM), dst * DIM)
    dst++
  }
  for (const emb of (userEmbeddings || [])) {
    for (let j = 0; j < Math.min(emb.length, DIM); j++) {
      out[dst * DIM + j] = emb[j]
    }
    dst++
  }
  return out
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
    const origin = new URL(request.url).origin
    const staticEmb = await loadStaticEmbeddings(origin, env)

    const userClassics = Array.isArray(body?.userClassics) ? body.userClassics : []
    const userEmbeddings = Array.isArray(body?.userEmbeddings) ? body.userEmbeddings : []
    const removedIds = Array.isArray(body?.removedIds) ? body.removedIds : []

    const removed = new Set(removedIds)
    const merged = []
    for (let i = 0; i < classics.length; i++) {
      if (removed.has(classics[i].id)) continue
      merged.push({ ...classics[i], _initialIndex: i })
    }
    for (const c of userClassics) merged.push({ ...c })

    const mergedEmb = buildMergedEmbeddings(classics, staticEmb, removedIds, userEmbeddings)

    const { status, body: out } = await handleChat({
      userInput: content,
      apiKey: env.DASHSCOPE_API_KEY,
      model: env.LLM_MODEL || 'qwen-plus',
      classics: merged,
      embeddingsUrl: null,
      embeddingDim: DIM,
      initialEmbeddings: mergedEmb,
      userEmbeddings,
      removedIds,
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
