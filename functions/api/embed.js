// functions/api/embed.js - Cloudflare Pages Function
// 为给定文本列表生成 embedding 向量（供藏书阁"新建"/"批量导入"时调用）

import { embedTexts } from '../../lib/embed.mjs'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json;charset=utf-8', ...CORS },
  })
}

export async function onRequestPost({ request, env }) {
  let body
  try {
    body = await request.json()
  } catch {
    return json(400, { error: 'Invalid JSON body' })
  }

  const texts = body?.texts
  if (!Array.isArray(texts) || texts.length === 0) {
    return json(400, { error: 'texts 必须是非空数组' })
  }
  if (texts.length > 100) {
    return json(400, { error: '单次最多 100 条' })
  }

  const apiKey = env.DASHSCOPE_API_KEY
  if (!apiKey) {
    return json(500, { error: 'DASHSCOPE_API_KEY 未配置' })
  }

  try {
    const embeddings = await embedTexts(texts, apiKey, 1024)
    return json(200, { embeddings })
  } catch (err) {
    console.error('embed API error:', err)
    return json(502, { error: 'Embedding 生成失败：' + err.message })
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS })
}

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return onRequestOptions()
  if (context.request.method !== 'POST') return json(405, { error: 'Method Not Allowed' })
  return onRequestPost(context)
}
