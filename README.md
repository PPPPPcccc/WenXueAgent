# 文心疗愈 · Vercel 版

基于通义千问（qwen-plus）与中华典籍的情绪疗愈 Web 应用 — **Vercel 部署版**。

与原 `frontend/` + `backend/` 项目功能等价，但**完全独立**：
- 经典匹配算法（Python → JS）已移植到 `src/lib/`
- 候选筛选 + Prompt 拼装在 Vercel Serverless Function `api/chat.js` 里执行
- 用户典籍 / 历史 / 收藏存在浏览器 `localStorage`，无需数据库
- 适配电脑 Web + 手机 Web（响应式）

## 项目结构

```
vercel-app/
├── api/
│   └── chat.js                 ← Vercel Serverless Function（qwen-plus 代理）
├── public/
│   └── data/
│       └── classics.json       ← 初始经典库（26 条，可在 Admin 增删）
├── src/
│   ├── api/index.js            ← /api/chat 客户端
│   ├── views/                  ← ChatView / HistoryView / AdminView
│   ├── components/             ← AppHeader / ReplyCard / MountainDeco
│   ├── composables/            ← useClassics（共享经典库）
│   ├── lib/                    ← matcher / prompt / parser / store / classics-io
│   ├── router/                 ← Vue Router
│   ├── styles/ink.css          ← 水墨风主题
│   ├── App.vue
│   └── main.js
├── index.html
├── package.json
├── vite.config.js
└── vercel.json
```

## 本地开发

```bash
cd vercel-app
npm install
npm run dev
# 访问 http://127.0.0.1:5173
```

本地开发时，**`/api/chat` 仍会请求真实 qwen-plus**（通过环境变量）。你可以：
- 在 `vercel-app/.env` 里写 `DASHSCOPE_API_KEY=sk-xxx`
- 或者直接部署到 Vercel 后再测（更简单）

## 部署到 Vercel（推荐）

### 1. 推送代码到 GitHub
把整个 `vercel-app/` 目录推到一个 GitHub 仓库（或者把整个 `文学回复/` 推到仓库、只把 `vercel-app` 当成项目根部署）。

### 2. 在 Vercel 导入项目
- 访问 https://vercel.com/new
- Import 你的仓库
- **Root Directory** 选 `vercel-app`
- Framework Preset 选 `Vite`

### 3. 配置环境变量
Project Settings → Environment Variables，添加：
- `DASHSCOPE_API_KEY` = 你的阿里云百炼 API Key
- （可选）`LLM_MODEL` = `qwen-plus`（默认就是这个）

### 4. 部署
点 Deploy，约 1 分钟。之后每次 git push 都会自动重新部署。

## 免费额度

| 服务 | 免费额度 |
|---|---|
| Vercel Hobby | 100 GB-Hours/月 Serverless，100 GB 流量，永久免费 |
| Vercel Functions | 10s 超时（Hobby），足够 qwen-plus 响应 |
| DashScope qwen-plus | 注册送 100 万 tokens 免费额度（约几千次对话） |

## 与原项目的区别

| 项 | 原项目 | Vercel 版 |
|---|---|---|
| 后端 | FastAPI + SQLite | Vercel Serverless Function |
| 典籍库存储 | SQLite | 浏览器 localStorage |
| 历史/收藏存储 | SQLite | 浏览器 localStorage |
| 典籍总量 | 1117 条 | 26 条初始 + Admin 中无限添加 |
| 域名 | localhost | vercel.app 子域名（可绑自定义域名） |
| 访问限制 | 仅本机 | 全网（国内访问 vercel.app 偶有波动） |

## 国内访问

- Vercel 在国内**偶尔抽风**，但通常能正常打开
- 如果你介意这点，可以绑定自己的域名（已备案）走 Cloudflare 中转
- 或者直接用国外用户测

## 常见问题

### 1. API 返回 "DASHSCOPE_API_KEY 未配置"
没在 Vercel 设置环境变量。重新部署后生效。

### 2. 返回 "DashScope HTTP 401"
API Key 无效或过期。检查阿里云控制台 https://bailian.console.aliyun.com/

### 3. 返回 "pattern not matched"
模型偶尔不按格式输出。函数内部会自动重试一次，再不行就用兜底文案。

### 4. 用户新增的典籍不见了？
典籍存在浏览器 localStorage。换浏览器 / 清除浏览数据会丢失。重要数据请用 Admin → 导出 备份为 txt。

### 5. Serverless Function 10s 超时
极少数情况下 qwen-plus 响应慢。函数内置 25s 客户端超时；服务端跑满 10s 也会自动失败重试。
