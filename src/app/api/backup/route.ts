import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

function timestamp(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");
}

export async function GET() {
  const dbPath = path.join(process.cwd(), "prisma", "dev.db");

  try {
    const file = await readFile(dbPath);
    return new Response(file, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="next-step-${timestamp()}.db"`,
      },
    });
  } catch {
    return Response.json(
      { error: "数据库文件不可用，请先确认迁移已完成。" },
      { status: 500 },
    );
  }
}
