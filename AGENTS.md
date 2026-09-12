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
- 界面少用解释性小字：页面标题下、步骤标题下、账号资料里的说明文案默认删掉；能用「写想法 / 谈感受 / 建项目 / 定今日」这类短标题表达，就不要补一句解释。
- 左侧栏下半部分固定顺序：工具匣 → 模式切换 → 用户；退出登录只放在用户菜单里。
- 任务行外层显示精炼标题，悬停显示完整任务内容；便利贴悬停输入框必须在鼠标移入弹层后继续显示。
- 复盘保存时，后续任务要自动归入对应项目，不能继续堆进「未关联任务」。

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

# 新人引导设计（2026-09-12 定稿，跨会话记忆，勿删）

- **入口原则**：落地页主 CTA「立即体验 · 免注册」直接触发 `startGuestExperience` 进真产品；`/onboarding` 只是演示，降级为次级按钮「看 30 秒演示」。用户在哪写过想法，就往哪继续，不要把演示和真流程串成"写两遍"。
- **想法传递**：演示页/落地页写的那句话用 `src/lib/pending-idea.ts`（localStorage `next_step_pending_idea`）带到 `/welcome` 预填。
- **新手态必须服务端判定**：`src/lib/first-run.ts` 用 `UserPreference(first_run_tour)` + 「注册 14 天内 + 项目 ≤ 1 + 任务 ≤ 3」判定，别再依赖 localStorage `next_step_new_user`（那条路径极脆：只在 /welcome 挂载时写一次）。
- **三步锚定引导**：`src/components/first-run-tour.tsx` + `anchored-hint.tsx`。目标元素用 `data-tour` 标记（`task-next` / `task-tools` / `bottom-nav` / `side-nav` / `guest-banner`）。第 1 步点「下一步」后进入第 2 步，完成首个任务进入第 3 步；不做全屏蒙层聚光灯（滚动/移动端易错位）。
- **游客态必须常驻可见**：`GuestBanner`（layout 渲染）说明"内容只保存在这台浏览器，注册后可长期保存"。游客账号是随机用户名 + 随机密码且从不展示，会话 30 天，不提醒就是无声数据丢失。
- **新手期图标展开文字**：任务行三个图标（拆成小步 / 设置 / 问 AI）通过 `showLabels` 在新手期展开，引导结束后自动收起。
- **落点统一**：注册、游客转正、跳过引导后都落 `/workspace`（`welcome/page.tsx` 的 redirect 已改）。
- **首页取舍**：AI 设置（API 连接 / 执行偏好）收进「今日推进伙伴」面板底部的折叠区，第一屏留给"记想法 + 今天做什么"。
- **待办（未做）**：日历/抽屉/工具页的锚定气泡目前仍是 PageHint 角落卡片（已由服务端新手态 gate）；若要继续收敛，按同一套 `data-tour` + AnchoredHint 改造。

# 账号资料与页面框架（2026-09-12，跨会话记忆，勿删）

- **角落的账号资料**：`src/components/profile-card.tsx`（头像 + 昵称 + 改/取消）。桌面在左侧栏底部、移动端在顶栏右侧，由 `Sidebar` 的 `user` prop 传入（来源是 `layout.tsx` 的 `getCurrentUser()`）。
- **头像存储方式**：不做对象存储。浏览器端用 canvas 压成 192×192 JPEG 的 data URL（约 10-30KB）存进 `users.avatarUrl`；服务端 `updateUserProfile` 只接受 `data:image/` 且 ≤400KB，否则丢弃。换头像的入口就是那张资料卡（无需新页面）。
- **营销页必须隔离应用框架**：`/landing`、`/login`、`/onboarding`、`/welcome`、`/guest/register` 通过 `src/components/app-chrome.tsx` 的 `FULLSCREEN_ROUTES` 完全不渲染 Sidebar / CommandPalette。历史坑：这些页面用 `fixed inset-0 z-40` 覆盖，但容器是透明的，z-30 的侧栏/底部导航会透出来，落地页左上角出现两个 logo 重叠。
- **改这些页面的路径时**：新增整屏页面记得同时加进 `FULLSCREEN_ROUTES`，否则又会露出侧栏。
