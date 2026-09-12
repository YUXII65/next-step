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

# 线上部署（跨会话记忆，勿删）

- 正式线上域名：`https://nextstep9.work`（EdgeOne Pages，响应头 `server: edgeone makers`）。给用户分享/验收一律用这个域名，不要用 trycloudflare 临时隧道地址。
- 部署方式：提交并 `git push origin codex/edgeone-deploy`，EdgeOne 自动跑 `npm run build:edgeone`（= prisma generate && prisma migrate deploy && next build）。仓库：`YUXII65/next-step`。
- 部署期间会短暂出现「新 HTML 已生效、`/_next/static/*` 还没就绪」的无样式窗口（页面只剩裸 HTML + 巨大的 BrandMark SVG）。这是部署中间态，不是代码或浏览器问题；刷新即可恢复。
- 判断是否仍处于中间态：抓页面 HTML 里 `href` 的 CSS 地址，再请求它，看是否 `200 + text/css`；同时用 `匹配关键文案` 确认线上是否已是新版。
- 生产 CSS 由 EdgeOne 构建产出（Tailwind v4，`@layer` 仍在，但 `oklch()` 会被降级为 rgb/hex），因此桌面现代浏览器正常；只有不支持 `@layer` 的极老浏览器才会整页无样式。

# 掉链子根因（2026-09-12 实测，跨会话记忆，勿删）

- **现象**：新版本上线后打开网站，页面完全没有样式（只剩裸 HTML + 巨大的 BrandMark 箭头色块），刷新也不好。
- **机制**：EdgeOne Pages 发布时先切 HTML、后补 `/_next/static/*`。发布窗口内请求这些资源会拿到 **404**，而这个 404 带着 `Cache-Control: public, max-age=31536000, immutable`，会被浏览器缓存住。等资源补齐后，普通刷新仍命中那份缓存的 404 —— 所以页面会“坏很久”，只有强刷（Ctrl+Shift+R）或换无痕窗口才恢复。
- **已做的三层防御**（`src/lib/asset-guard.ts` + `src/app/layout.tsx` + `src/components/brand-mark.tsx`）：
  1. 内联守卫脚本（不依赖 `/_next/static/*`，所以它是发布窗口里唯一一定能跑起来的 JS）：检测样式表是否真的生效，没生效就用 `?asset-retry=<时间戳>` 重新拉取，绕开被缓存的 404；对 404 的 `/_next/static/*` 脚本同样补拉。
  2. 兜底样式：失败期间给 `<html>` 打 `data-asset-degraded="1"`，启用一份极简可读样式，不参与正常加载。
  3. BrandMark 的内联 SVG 改成「固有尺寸 64 + `h-[58%] w-[58%]`」，不再用内联百分比 `style`；样式表挂掉时它只会是一枚小图标，而不是撑爆整屏的色块。
- **验证方式**（复现脚本在 `%TEMP%\asset-guard-check`）：用带 immutable 头的 404 模拟发布窗口，无头 Chrome 对照——无守卫时第二次打开仍然是无样式，带守卫时自动恢复成有样式。
- **发布后自检**：抓首页 HTML 里的 CSS 地址并带任意查询串请求一次（例如 `...css?asset-retry=1`），返回 `200 + text/css` 即为资源就绪；若仍是 404，说明还在发布窗口内，等十几秒再看。
