// api/chat.js - Vercel Serverless Function
// 适配 Vercel Node 运行时（使用 fs 读 classics.json）

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { handleChat, loadEmbeddings } from '../lib/chat.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 经典库缓存
let classicsCache = null
let cacheAt = 0
const CACHE_TTL_MS = 60_000

async function loadClassics() {
  const now = Date.now()
  if (classicsCache && now - cacheAt < CACHE_TTL_MS) return classicsCache
  // /var/task/api/chat.js -> /var/task/public/data/classics.json
  const candidates = [
    path.join(__dirname, '..', 'public', 'data', 'classics.json'),
    path.join(process.cwd(), 'public', 'data', 'classics.json'),
    path.join('/var/task', 'public', 'data', 'classics.json'),
  ]
  let raw = null
  for (const p of candidates) {
    try { raw = await fs.readFile(p, 'utf-8'); break } catch {}
  }
  if (!raw) throw new Error('经典库加载失败（public/data/classics.json 不存在）')
  classicsCache = JSON.parse(raw)
  cacheAt = now
  return classicsCache
}

async function readBody(req) {
  if (req.body) return req.body
  return JSON.parse(await new Promise((resolve, reject) => {
    let buf = ''
    req.on('data', (c) => (buf += c))
    req.on('end', () => resolve(buf || '{}'))
    req.on('error', reject)
  }))
}

export default async function handler(req, res) {
  // CORS
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
    body = await readBody(req)
  } catch {
    res.status(400).json({ error: 'Invalid JSON body' })
    return
  }

  const content = String(body?.content || '').trim()
  if (!content) { res.status(400).json({ error: 'content 不能为空' }); return }
  if (content.length > 500) { res.status(400).json({ error: '内容过长（>500 字）' }); return }

  try {
    const classics = await loadClassics()
    const { status, body: out } = await handleChat({
      userInput: content,
      apiKey: process.env.DASHSCOPE_API_KEY,
      model: process.env.LLM_MODEL || 'qwen-plus',
      classics,
    })
    res.status(status).json(out)
  } catch (err) {
    console.error('chat handler error:', err)
    res.status(500).json({ error: err.message || '服务器内部错误' })
  }
}
