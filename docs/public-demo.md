# 公开演示服务

`scripts/start-public-demo.ps1` 会启动一个独立的公开演示实例：

- 端口：`3001`
- 数据库：`prisma/public-demo.db`
- 访问密码：默认 `123456`，可用 `PUBLIC_DEMO_PASSWORD` 修改
- 公网地址：写入 `.public-demo/tunnel.url`

该演示实例不会读取或写入个人使用的 `prisma/dev.db`，适合先公开给少量人体验。

## 启动

```powershell
pnpm public:demo
```

需要重新生成演示数据时：

```powershell
pnpm public:demo:reset
```

## 注意事项

Cloudflare 快速隧道生成的是临时域名，电脑重启或隧道重连后地址可能变化。如果要长期稳定公开，建议把数据库迁到 PostgreSQL，并部署到支持持久化磁盘的单实例服务器，而不是继续用本机 SQLite 加隧道。
