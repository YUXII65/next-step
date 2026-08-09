import { PrismaClient } from "@prisma/client";

const args = process.argv.slice(2);
if (!args.includes("--force")) {
  console.error("This command clears and seeds demo data. Run with --force to proceed.");
  process.exit(1);
}

const prisma = new PrismaClient();

await prisma.$transaction([
  prisma.reviewNextAction.deleteMany(),
  prisma.reviewTask.deleteMany(),
  prisma.aiFeedbackEvent.deleteMany(),
  prisma.aiPlanFeedback.deleteMany(),
  prisma.task.deleteMany(),
  prisma.inboxItem.deleteMany(),
  prisma.review.deleteMany(),
  prisma.project.deleteMany(),
  prisma.userPreference.deleteMany(),
]);

const today = new Date();
today.setHours(0, 0, 0, 0);

const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

const dayAfter = new Date(today);
dayAfter.setDate(dayAfter.getDate() + 2);

const contentProject = await prisma.project.create({
  data: {
    name: "内容账号启动",
    objective: "把零散内容想法变成可持续更新的个人内容账号",
    currentMilestone: "完成第一期内容并发布",
    status: "active",
    notes: "先做最小发布，再逐步建立内容方向。",
  },
});

const aiProject = await prisma.project.create({
  data: {
    name: "AI 技能提升",
    objective: "通过实践掌握 AI 工具和基础编程能力",
    currentMilestone: "暂停中，等第一期内容发布后再重启",
    status: "paused",
    notes: "避免同时推进太多项目。",
  },
});

const stickyTask = await prisma.task.create({
  data: {
    title: "选一个内容方向，写第一期开头",
    notes: "我总想一次把所有内容都想清楚，结果一直没发。",
    projectId: contentProject.id,
    status: "in_progress",
    priority: "high",
    scheduledDate: today,
    dueDate: tomorrow,
    planOrder: 0,
  },
});

await prisma.task.createMany({
  data: [
    {
      title: "列出 3 个你想长期做的内容方向",
      notes: "不用写完整方案，只写方向。",
      projectId: contentProject.id,
      status: "done",
      priority: "high",
      scheduledDate: today,
      completedAt: new Date(),
      planOrder: 1,
    },
    {
      title: "写三个开头，选最顺的一版",
      notes: "先降低发布门槛，不做完美版本。",
      projectId: contentProject.id,
      status: "todo",
      priority: "high",
      scheduledDate: tomorrow,
      dueDate: dayAfter,
      planOrder: 2,
    },
    {
      title: "发布第一期内容",
      notes: "目标是完成一次发布，而不是一次做完整套内容体系。",
      projectId: contentProject.id,
      status: "todo",
      priority: "medium",
      scheduledDate: dayAfter,
      dueDate: dayAfter,
      planOrder: 3,
    },
    {
      title: "把 AI 技能提升项目标记为暂停",
      notes: "本周只推进内容账号，避免目标过载。",
      projectId: aiProject.id,
      status: "done",
      priority: "medium",
      scheduledDate: today,
      completedAt: new Date(),
      planOrder: 0,
    },
  ],
});

await prisma.inboxItem.create({
  data: {
    content: "把之前拍过的素材整理成第一期内容",
    source: "manual",
    status: "inbox",
  },
});

await prisma.review.create({
  data: {
    reviewDate: today,
    summary: "今天没有发布，但确认了方向。问题不是不会做，而是想一次做完整。",
    nextActions: "写出三个开头\n选一个发布",
    status: "final",
  },
});

console.log(
  JSON.stringify(
    {
      project: contentProject.name,
      stickyTask: stickyTask.title,
      stickyTaskId: stickyTask.id,
      next: "打开今日页或工作台开始拍摄",
    },
    null,
    2,
  ),
);

await prisma.$disconnect();
