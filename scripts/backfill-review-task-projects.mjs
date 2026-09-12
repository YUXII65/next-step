import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const tasks = await prisma.task.findMany({
  where: {
    projectId: null,
    reviewNextAction: { isNot: null },
  },
  select: {
    id: true,
    title: true,
    reviewNextAction: {
      select: {
        review: {
          select: {
            tasks: {
              where: { projectId: { not: null } },
              select: { projectId: true },
            },
          },
        },
      },
    },
  },
});

let updated = 0;
let skipped = 0;

for (const task of tasks) {
  const projectCounts = new Map();

  for (const reviewTask of task.reviewNextAction?.review.tasks ?? []) {
    if (!reviewTask.projectId) continue;
    projectCounts.set(
      reviewTask.projectId,
      (projectCounts.get(reviewTask.projectId) ?? 0) + 1,
    );
  }

  const projectId = [...projectCounts.entries()].sort(
    (a, b) => b[1] - a[1],
  )[0]?.[0];

  if (!projectId) {
    skipped += 1;
    continue;
  }

  await prisma.task.update({
    where: { id: task.id },
    data: { projectId },
  });
  updated += 1;
}

console.log(`复盘后续任务回填完成：更新 ${updated} 条，跳过 ${skipped} 条。`);
await prisma.$disconnect();
