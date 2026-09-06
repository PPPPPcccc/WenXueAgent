// api/debug.js - Vercel 兼容版
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') { res.status(204).end(); return }
  const key = process.env.DASHSCOPE_API_KEY || ''
  res.status(200).json({
    request_url: req.url,
    env_keys: Object.keys(process.env || {}),
    DASHSCOPE_API_KEY: {
      exists: !!key,
      length: key.length,
      preview: key ? `${key.slice(0, 4)}...${key.slice(-4)}` : null,
    },
    LLM_MODEL: process.env.LLM_MODEL || '(unset, fallback to qwen-plus)',
    runtime: 'vercel-node',
    time: new Date().toISOString(),
  })
}
