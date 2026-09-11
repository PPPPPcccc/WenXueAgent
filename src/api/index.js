// api/index.js
// Vercel 版 API 客户端 - 不依赖 axios（避免增加包体积）
// 直接 fetch /api/chat

const TIMEOUT_MS = 25000 // Vercel Hobby 免费版超时 10s，留点余地给前端

async function fetchJSON(url, options = {}) {
  const ctrl = new AbortController()
  const tid = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const resp = await fetch(url, {
      ...options,
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    })
    clearTimeout(tid)
    let data
    try {
      data = await resp.json()
    } catch {
      data = { detail: `非 JSON 响应 (HTTP ${resp.status})` }
    }
    if (!resp.ok) {
      const msg = data?.detail || data?.error || `HTTP ${resp.status}`
      throw new Error(msg)
    }
    return data
  } catch (err) {
    clearTimeout(tid)
    if (err.name === 'AbortError') {
      throw new Error('请求超时（>25s），请检查网络或重试')
    }
    throw err
  }
}

export const chatApi = {
  send(content) {
    return fetchJSON('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ content }),
    })
  },
}

export async function fetchInitialClassics() {
  // 打包时 vite 把 classics.json 内联进 public/data/，通过 fetch 加载
  const resp = await fetch('/data/classics.json')
  if (!resp.ok) throw new Error('加载初始经典库失败')
  return resp.json()
}

export default { chatApi, fetchInitialClassics }
