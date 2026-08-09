# Vercel + Neon 免费公开部署

这个部署分支使用 PostgreSQL，供 Vercel 免费托管公开版本使用。`main` 分支继续保留 SQLite 本地个人版，二者互不影响。

## 1. 创建 Neon 数据库

1. 注册 Neon 免费账号并创建一个项目。
2. 在 Neon 控制台复制两个连接串：
   - 连接池地址放到 `DATABASE_URL`
   - 直连地址放到 `DIRECT_URL`
3. 示例：

```env
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
DIRECT_URL="postgresql://user:password@host/dbname?sslmode=require"
```

## 2. 在 Vercel 导入仓库

1. 注册 Vercel 免费账号。
2. 导入 GitHub 仓库 `YUXII65/next-step`。
3. 把 Production Branch 设置为 `codex/vercel-neon-deploy`。
4. 项目会自动使用仓库里的 `vercel.json`，构建命令为：

```bash
pnpm build:vercel
```

这个命令会依次执行：

```bash
prisma generate
prisma migrate deploy
next build
```

## 3. 配置环境变量

在 Vercel 项目的 Environment Variables 里配置：

```env
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
DIRECT_URL="postgresql://user:password@host/dbname?sslmode=require"
DEEPSEEK_API_KEY="sk-..."
DEEPSEEK_MODEL="deepseek-v4-flash"
DEEPSEEK_BASE_URL="https://api.deepseek.com"
APP_ACCESS_PASSWORD="改成你自己的访问密码"

AI_QUOTA_ENABLED=true
AI_QUOTA_DAILY_CALLS=200
AI_QUOTA_DAILY_TOKENS=100000
AI_QUOTA_VISITOR_DAILY_CALLS=10
AI_QUOTA_VISITOR_DAILY_TOKENS=20000
```

也可以先复制 `.env.vercel.example`，再按 Vercel 的批量导入格式粘贴。

## 4. 部署与检查

1. 点击 Deploy。
2. 首次构建会自动创建 PostgreSQL 表结构。
3. 部署完成后打开 Vercel 给的域名，用 `APP_ACCESS_PASSWORD` 登录。
4. 用几次 AI 功能，然后在 Neon 控制台或 Prisma Studio 查看 `ai_usage_logs`。

## 维护说明

- 以后更新公开版，直接推送到 `codex/vercel-neon-deploy`，Vercel 会自动部署。
- 不要在 `main` 上跑这个分支的构建，`main` 仍然是 SQLite 本地版。
- DeepSeek API Key 只放在 Vercel 环境变量里，不会提交到 GitHub。
- 免费额度内没有服务器月租。Vercel 和 Neon 的免费额度对这个工具的日调用规模通常足够。
