import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const [projects, tasks, inboxItems, reviews] = await Promise.all([
    prisma.project.findMany({
      include: {
        tasks: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.task.findMany({
      include: {
        project: true,
        inboxItem: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.inboxItem.findMany({
      orderBy: { createdAt: "desc" },
    }),
    prisma.review.findMany({
      include: {
        tasks: true,
        nextActionTasks: true,
      },
      orderBy: { reviewDate: "desc" },
    }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    projects,
    tasks,
    inboxItems,
    reviews,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="next-step-export-${new Date()
        .toISOString()
        .slice(0, 10)}.json"`,
    },
  });
}
