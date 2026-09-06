// functions/api/debug.js - 诊断用：检查环境变量是否到达函数
// 访问 /api/debug 即可看到（不暴露密钥值，只显示存在与长度）

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json;charset=utf-8', ...CORS },
  })
}

export async function onRequestGet(context) {
  const { env, request } = context
  const key = env.DASHSCOPE_API_KEY || ''
  return jsonResponse(200, {
    request_url: request.url,
    env_keys: Object.keys(env || {}),
    DASHSCOPE_API_KEY: {
      exists: !!key,
      length: key.length,
      preview: key ? `${key.slice(0, 4)}...${key.slice(-4)}` : null,
    },
    LLM_MODEL: env.LLM_MODEL || '(unset, fallback to qwen-plus)',
    runtime: 'cloudflare-pages-function',
    time: new Date().toISOString(),
  })
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS })
}
