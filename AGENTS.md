<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 本地预览（跨会话记忆，勿删）

> 用户已多次遇到「本地链接打不开」。需要给用户看 UI 效果时，必须保证服务在**会话结束后仍可用**，不要只在会话内前台运行。

- 启动方式：用独立后台进程（PowerShell，工作目录 = 项目根）：

  ```powershell
  Start-Process -FilePath "node" `
    -ArgumentList @("node_modules/next/dist/bin/next","dev","-p","3000") `
    -WorkingDirectory "<项目根>" -WindowStyle Hidden `
    -RedirectStandardOutput "<项目根>\.next-dev-3000.out.log" `
    -RedirectStandardError "<项目根>\.next-dev-3000.err.log"
  ```

- 链接：`http://localhost:3000`（同一局域网可用 `http://<本机IP>:3000`）。给用户链接时同时说明停服/重启方式。
- 端口占用时改 3001/3002 等，并把新链接告诉用户。
- 排障顺序：`Get-NetTCPConnection -LocalPort 3000 -State Listen` 确认监听 → 看 `.next-dev-3000.out.log` / `.next-dev-3000.err.log`。
- 数据库是 Neon Postgres（`.env` 的 `DATABASE_URL`）：冷启动偶发 `terminating connection due to administrator command`，属环境问题不是代码 bug；登录/注册等写库操作偶尔需重试。

# 产品取舍（跨会话记忆，勿删）

- 界面不强调 token / 成本消耗：用户明确说过「这个项目并不追求花多少 token」。首页不要做「今日 AI 用量 / token / 剩余次数」这类消耗看板（已于 2026-09-11 移除 `AiUsageCard`）。
- AI 用量只作为后台配额与降级逻辑存在（`src/lib/ai-quota.ts` 的 `AI_QUOTA_*`），不作为卖点或用户可见指标。若将来需要提示配额，只允许在「快用完」时给一行极轻的提醒，不做数字看板。
