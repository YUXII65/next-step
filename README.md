# 下一步

下一步是一个 AI 个人项目推进系统，核心闭环为：

`输入 → 目标 → 行动 → 复盘`

## 技术栈

- Next.js 16 + TypeScript
- Tailwind CSS
- Prisma 6 + SQLite
- lucide-react 图标

## 本地运行

需要 Node.js 20+ 和 pnpm。

```bash
pnpm install
pnpm db:migrate
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000)。

## 常用命令

```bash
pnpm db:migrate
pnpm db:generate
pnpm db:backup
pnpm db:studio
pnpm build
pnpm lint
```

## 数据备份

- 页面左侧边栏的“导出数据备份”可直接下载 `prisma/dev.db`。
- 命令行备份：`pnpm db:backup`，备份文件写入 `backups/`。

## 生产运行

```bash
pnpm build
pnpm start
```

部署注意：本项目使用 SQLite 本地文件，需要持久化保存 `prisma/dev.db` 和 `backups/`。该架构适合单机或单实例部署，不适合 Serverless 或多实例共享写入。

## 数据

本地数据库文件位于 `prisma/dev.db`，已被 `.gitignore` 忽略。AI API Key 通过本地环境变量配置，不在浏览器中保存。

## AI 能力

可选配置 DeepSeek API Key：

```bash
DEEPSEEK_API_KEY="sk-..."
DEEPSEEK_MODEL="deepseek-chat"
DEEPSEEK_BASE_URL="https://api.deepseek.com"
```

未配置 Key 或 AI 调用失败时，系统会自动使用本地规则生成任务拆分、今日建议和复盘草稿。

## 当前阶段

- Stage 1：项目骨架、数据库表、三个一级页面。
- Stage 2：项目树、项目详情、项目 CRUD、任务 CRUD。
- Stage 3：收件箱快捷输入、原内容直接转为任务、忽略记录。
- Stage 4：今日页展示逾期、计划任务、今日重点，并支持设为重点和完成任务。
- Stage 5：收件箱 AI 归类建议、今日重点建议、复盘草稿生成，均支持手动降级。
- Stage 6：复盘编辑、保存、历史、数据备份、生产运行与部署说明。
- 下一步：继续真实使用，验证核心闭环和 AI 记忆反馈闭环。
