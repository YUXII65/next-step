import { copyFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dbPath = path.join(root, "prisma", "dev.db");
const backupDir = path.join(root, "backups");

function timestamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");
}

try {
  await stat(dbPath);
} catch {
  console.error("未找到数据库文件：prisma/dev.db");
  process.exit(1);
}

await mkdir(backupDir, { recursive: true });

const backupPath = path.join(backupDir, `next-step-${timestamp()}.db`);
await copyFile(dbPath, backupPath);

console.log(`备份完成：${path.relative(root, backupPath)}`);
