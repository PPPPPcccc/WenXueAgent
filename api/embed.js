// api/embed.js - Vercel Serverless Function
// 为给定文本列表生成 embedding 向量（供藏书阁"新建"/"批量导入"时调用）

import { embedTexts } from '../lib/embed.mjs'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json;charset=utf-8', ...CORS_HEADERS },
  })
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.status(204).end(); return }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }

  let body
  try {
    body = typeof req.body === 'object' ? req.body : JSON.parse(await new Promise((resolve, reject) => {
      let buf = ''
      req.on('data', c => (buf += c))
      req.on('end', () => resolve(buf || '{}'))
      req.on('error', reject)
    }))
  } catch {
    res.status(400).json({ error: 'Invalid JSON body' })
    return
  }

  const texts = body?.texts
  if (!Array.isArray(texts) || texts.length === 0) {
    res.status(400).json({ error: 'texts 必须是非空数组' })
    return
  }
  if (texts.length > 100) {
    res.status(400).json({ error: '单次最多 100 条' })
    return
  }

  const apiKey = process.env.DASHSCOPE_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'DASHSCOPE_API_KEY 未配置' })
    return
  }

  try {
    const embeddings = await embedTexts(texts, apiKey, 1024)
    res.status(200).json({ embeddings })
  } catch (err) {
    console.error('embed API error:', err)
    res.status(502).json({ error: 'Embedding 生成失败：' + err.message })
  }
}
