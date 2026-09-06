# 文心疗愈 · 一次代码，两个平台

基于通义千问（qwen-plus）与中华典籍的情绪疗愈 Web 应用 — **Vercel / Cloudflare Pages 双部署**。

与原 `frontend/` + `backend/` 项目功能等价，但**完全独立**：
- 经典匹配算法（Python → JS）已移植到 `lib/chat.mjs`
- 候选筛选 + Prompt 拼装在 Serverless Function 里执行
- 用户典籍 / 历史 / 收藏存在浏览器 `localStorage`，无需数据库
- 适配电脑 Web + 手机 Web（响应式）

## 一份代码同时支持两个平台

| 文件 | 作用 |
|---|---|
| `lib/chat.mjs` | **共享核心**：匹配 + Prompt + DashScope 调用 + 响应解析 |
| `api/chat.js` | **Vercel** 适配（Node.js 运行时，用 fs 读 classics.json） |
| `functions/api/chat.js` | **Cloudflare Pages** 适配（Workers 运行时，import 内联 JSON） |
| `src/` | Vue 3 前端（两边共用） |
| `public/data/classics.json` | 初始经典库（26 条） |
| `vercel.json` | Vercel 路由配置 |
| `wrangler.toml` | Cloudflare Pages 配置 |

## 国内访问推荐：Cloudflare Pages ⭐

Vercel 在国内被墙，**Cloudflare Pages** 才能在国内打开：

- 中国访问走香港 / 日本 / 新加坡节点，实测可访问
- 不需要实名认证
- 免费额度 100k 请求/天
- Serverless 默认 30s 超时（比 Vercel Hobby 的 10s 更宽松）

## 部署到 Cloudflare Pages（推荐）

### 1. 推送代码到 GitHub
把 `vercel-app/` 目录整个推送（或把整个 `文学回复/` 都推上去，CF Pages 部署时指定 Root 为 `vercel-app`）。

### 2. 在 Cloudflare 创建 Pages 项目
1. 登录 https://dash.cloudflare.com/
2. Workers 和 Pages → Create application → Pages → Connect to Git
3. 选择你的 GitHub 仓库
4. 配置构建设置：
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `vercel-app`（如果仓库根不是它）

### 3. 设置环境变量
部署前在 "Environment variables (advanced)" 添加：
- `DASHSCOPE_API_KEY` = 你的阿里云百炼 API Key
- （可选）`LLM_MODEL` = `qwen-plus`

### 4. 部署
点 Save and Deploy，约 1-2 分钟拿到 `xxx.pages.dev` 子域名。

之后修改代码，git push 会自动重新部署。

## 部署到 Vercel（备选）

如果你的用户主要在海外，仍可用 Vercel：

### 1. GitHub 推送
同上面。

### 2. Vercel 导入
- https://vercel.com/new → Import
- Root Directory 选 `vercel-app`
- Framework Preset: Vite

### 3. 环境变量
Settings → Environment Variables：
- `DASHSCOPE_API_KEY` = 你的 API Key

### 4. 部署
点 Deploy，1 分钟后拿到 `xxx.vercel.app`。

## 本地开发

### 测试前端（无需后端）
```bash
cd vercel-app
npm install
npm run dev   # 访问 http://127.0.0.1:5173
```

### 测试后端（本地模拟 Serverless）

测试 Vercel 函数：
```bash
npm i -g vercel
vercel dev
# 然后 npm run dev 启动前端
```

测试 Cloudflare 函数：
```bash
npm i -g wrangler
wrangler pages dev dist   # 需要先 npm run build
# 访问 http://127.0.0.1:8788
```

**简化做法**：直接部署到 Cloudflare Pages 再测，1 分钟就出结果。

## 免费额度对比

| | Cloudflare Pages | Vercel Hobby |
|---|---|---|
| 月请求 | 100,000 | 100,000 |
| Serverless 流量 | 无限 | 100 GB |
| 函数超时 | 30s | 10s（Hobby）/ 15s（Pro） |
| **国内访问** | ⭐ 可访问 | ✗ 被墙 |
| 需要实名 | ❌ | ❌ |

两者都足够个人使用。

## 与原项目的区别

| 项 | 原 FastAPI 版 | Vercel / Cloudflare 版 |
|---|---|---|
| 后端 | FastAPI + SQLite | Serverless Function |
| 典籍库 | SQLite (1117 条) | localStorage (26 条初始 + 无限添加) |
| 历史/收藏 | SQLite | 浏览器 localStorage |
| 域名 | localhost | vercel.app / pages.dev |
| 国内访问 | 仅本机 | Cloudflare 可访问 |

## 常见问题

### 1. 返回 "DASHSCOPE_API_KEY 未配置"
没在平台设置环境变量。重新部署后生效。

### 2. 返回 "DashScope HTTP 401"
API Key 无效。检查阿里云控制台 https://bailian.console.aliyun.com/

### 3. 返回 "pattern not matched"
模型偶尔不按格式输出。函数会自动重试一次，仍失败就用兜底文案。

### 4. 用户新增的典籍不见了？
典籍存在浏览器 localStorage，换浏览器或清数据会丢。重要数据请用 Admin → 导出 备份为 txt。

### 5. 国内访问 Cloudflare Pages 还是慢/连不上？
- 首次访问可能稍慢（DNS 解析 CF 节点需要 1-3 秒）
- 如果完全连不上，可能你所在 ISP 对 CF 节点封锁。这时考虑：
  - 改用自己的域名（用 Cloudflare 激活）
  - 或继续用 Vercel（但 Vercel 国内访问必然不行）
  - 或换国内平台（需要实名）

### 6. Cloudflare 函数超时？
Free 计划 30s 超时，qwen-plus 正常 3-8 秒响应。极冷启动可能 10+ 秒，但仍在 30s 内。

## 故障排查流程

1. 浏览器打开 `https://你的域名.pages.dev/`，看到 UI ✓
2. 浏览器开 Console，输入 `fetch('/api/health')` 应该 404（这个端点 Vercel 版才有），但 `/` 要返回 HTML
3. 在 UI 里输入测试，看 Network 面板里 `/api/chat` 的请求：
   - 401 / 403 → API Key 问题
   - 502 → LLM 调用失败（看 Vercel/Cloudflare Functions 日志）
   - 500 + JSON 错误 → 看错误消息

Cloudflare 日志位置：Pages 项目 → Functions → Logs
Vercel 日志位置：项目 → Logs → Functions
