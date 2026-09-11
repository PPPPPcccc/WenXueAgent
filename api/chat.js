// api/chat.js - Vercel Serverless Function
// 适配 Vercel Node 运行时（使用 fs 读 classics.json + 二进制 embeddings）

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { handleChat, loadEmbeddings } from '../lib/chat.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DIM = 1024

// 经典库 / 向量缓存（60s TTL，避免每次请求都读盘）
let classicsCache = null
let embeddingsCache = null
let cacheAt = 0
const CACHE_TTL_MS = 60_000

async function loadClassics() {
  const now = Date.now()
  if (classicsCache && now - cacheAt < CACHE_TTL_MS) return classicsCache
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

async function loadStaticEmbeddings() {
  const now = Date.now()
  if (embeddingsCache && now - cacheAt < CACHE_TTL_MS) return embeddingsCache
  const candidates = [
    path.join(__dirname, '..', 'public', 'data', 'classics_embeddings.f16.bin'),
    path.join(process.cwd(), 'public', 'data', 'classics_embeddings.f16.bin'),
    path.join('/var/task', 'public', 'data', 'classics_embeddings.f16.bin'),
  ]
  let buf = null
  for (const p of candidates) {
    try { buf = await fs.readFile(p); break } catch {}
  }
  if (!buf) throw new Error('静态 embeddings 加载失败（classics_embeddings.f16.bin 不存在）')
  // float16 → float32
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
  embeddingsCache = f32
  cacheAt = now
  return embeddingsCache
}

// 根据 removedIds 过滤静态 embeddings，并与 userEmbeddings 拼接成 Float32Array
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
    const staticClassics = await loadClassics()
    const staticEmb = await loadStaticEmbeddings()

    // 前端传来的增量数据（均可选）
    const userClassics = Array.isArray(body?.userClassics) ? body.userClassics : []
    const userEmbeddings = Array.isArray(body?.userEmbeddings) ? body.userEmbeddings : []
    const removedIds = Array.isArray(body?.removedIds) ? body.removedIds : []

    // 合并 classics：先 [静态-removed], 再 userClassics
    const removed = new Set(removedIds)
    const merged = []
    for (let i = 0; i < staticClassics.length; i++) {
      if (removed.has(staticClassics[i].id)) continue
      merged.push({ ...staticClassics[i], _initialIndex: i })
    }
    for (const c of userClassics) merged.push({ ...c })

    // 合并 embeddings
    const mergedEmb = buildMergedEmbeddings(staticClassics, staticEmb, removedIds, userEmbeddings)

    const { status, body: out } = await handleChat({
      userInput: content,
      apiKey: process.env.DASHSCOPE_API_KEY,
      model: process.env.LLM_MODEL || 'qwen-plus',
      classics: merged,
      // 不再用 URL 加载（已合并好）；initialEmbeddings 直接给合并后的 Float32Array
      embeddingsUrl: null,
      embeddingDim: DIM,
      initialEmbeddings: mergedEmb,
      userEmbeddings,
      removedIds,
    })
    res.status(status).json(out)
  } catch (err) {
    console.error('chat handler error:', err)
    res.status(500).json({ error: err.message || '服务器内部错误' })
  }
}
