import { prisma } from "@/lib/prisma";

export async function buildUserMemorySummary() {
  const [feedback, tasks, latestReview, activeProjects] = await Promise.all([
    prisma.aiPlanFeedback.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.task.findMany({
      select: { status: true },
    }),
    prisma.review.findFirst({
      select: { summary: true },
      orderBy: { reviewDate: "desc" },
    }),
    prisma.project.findMany({
      where: { status: "active" },
      select: {
        name: true,
        currentMilestone: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  const accepted = feedback.filter((item) => item.action === "accepted").length;
  const ignored = feedback.filter((item) => item.action === "ignored").length;
  const open = tasks.filter(
    (task) => task.status === "todo" || task.status === "in_progress",
  ).length;
  const completed = tasks.filter((task) => task.status === "done").length;

  const parts = [
    `用户近期接受 ${accepted} 次 AI 计划，忽略 ${ignored} 次`,
    `当前未完成任务 ${open} 个，累计完成 ${completed} 个`,
  ];

  if (latestReview) {
    parts.push(`最近复盘：${latestReview.summary.slice(0, 120)}`);
  }

  if (activeProjects.length) {
    parts.push(
      `活跃项目：${activeProjects
        .map((project) =>
          project.currentMilestone
            ? `${project.name}（${project.currentMilestone}）`
            : project.name,
        )
        .join("、")}`,
    );
  }

  return parts.join("；").slice(0, 600);
}
