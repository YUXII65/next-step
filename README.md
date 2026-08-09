# 下一步

下一步是一个公开可用的 AI 个人项目推进系统，核心闭环为：

`输入 → 目标 → 行动 → 复盘`

公开版功能：

- 注册 / 登录账号。
- 每个账号只能看到自己的项目、任务、收件箱和复盘。
- AI 由服务端统一调用 DeepSeek，不需要用户自己填 API Key。
- 每天每用户和全站都有用量限制，避免单个用户产生过高费用。

## 技术栈

- Next.js 16 + TypeScript
- Tailwind CSS
- Prisma 6 + PostgreSQL
- lucide-react 图标

## 公开展示部署

面向中国大陆用户的部署说明见 [docs/deploy-edgeone.md](docs/deploy-edgeone.md)。

EdgeOne 部署分支：`codex/edgeone-deploy`。

Vercel 部署说明仍保留在 [docs/vercel-neon-deploy.md](docs/vercel-neon-deploy.md)，适合不依赖中国大陆访问的场景。

## 本地个人版

`main` 分支保留 SQLite 本地个人版。需要 Node.js 20+ 和 pnpm。

```bash
pnpm install
pnpm db:migrate
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000)。

## 维护

- 公开版数据库、AI Key、会话密钥只配置在托管平台环境变量中。
- 推送 `codex/edgeone-deploy` 会自动触发 EdgeOne 部署。
- 配额环境变量可调整，但注意提高额度会直接提高 DeepSeek 费用风险。
