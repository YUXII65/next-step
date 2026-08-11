import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function redact(value: string) {
  return value
    .replace(/postgres(?:ql)?:\/\/[^\s]+/g, "postgresql://***")
    .replace(/sk-[A-Za-z0-9_-]+/g, "sk-***")
    .replace(/[?&](?:password|api[_-]?key|secret)=[^&\s]+/gi, "$1=***");
}

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        ok: false,
        name: error instanceof Error ? error.name : "Error",
        error: redact(message),
        diagnostics: {
          databaseUrlSet: Boolean(process.env.DATABASE_URL),
          directUrlSet: Boolean(process.env.DIRECT_URL),
          databaseUrlStartsWithPostgres: /^postgres(?:ql)?:\/\//.test(
            process.env.DATABASE_URL ?? "",
          ),
        },
      },
      { status: 503 },
    );
  }
}
