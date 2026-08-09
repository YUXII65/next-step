import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function countByAction(events, action) {
  return events.filter((event) => event.action === action).length;
}

const [feedbackEvents, aiTasks, reviews, preferences] = await Promise.all([
  prisma.aiFeedbackEvent.findMany({ select: { action: true } }),
  prisma.task.findMany({
    where: { inboxItemId: { not: null } },
    select: { status: true, completedAt: true },
  }),
  prisma.review.findMany({
    select: { reviewDate: true, status: true },
    orderBy: { reviewDate: "desc" },
    take: 14,
  }),
  prisma.userPreference.findMany({
    select: { key: true, value: true, source: true },
  }),
]);

const completedAiTasks = aiTasks.filter((task) => task.status === "done");
const openAiTasks = aiTasks.filter(
  (task) => task.status === "todo" || task.status === "in_progress",
);
const cancelledAiTasks = aiTasks.filter((task) => task.status === "cancelled");

const now = new Date();
const weekStart = new Date(now);
weekStart.setDate(weekStart.getDate() - 7);
const reviewsThisWeek = reviews.filter(
  (review) => review.reviewDate >= weekStart,
).length;

const metrics = {
  generatedAt: now.toISOString(),
  feedback: {
    planAccepted: countByAction(feedbackEvents, "plan_accepted"),
    planEdited: countByAction(feedbackEvents, "plan_edited"),
    planIgnored: countByAction(feedbackEvents, "plan_ignored"),
    suggestionUseful: countByAction(feedbackEvents, "suggestion_useful"),
    suggestionUseless: countByAction(feedbackEvents, "suggestion_useless"),
    suggestionApplied: countByAction(feedbackEvents, "suggestion_applied"),
    taskCompleted: countByAction(feedbackEvents, "task_completed"),
    taskCancelled: countByAction(feedbackEvents, "task_cancelled"),
    taskDelayed: countByAction(feedbackEvents, "task_delayed"),
  },
  aiTasks: {
    total: aiTasks.length,
    open: openAiTasks.length,
    done: completedAiTasks.length,
    cancelled: cancelledAiTasks.length,
    completionRate: aiTasks.length
      ? Number((completedAiTasks.length / aiTasks.length).toFixed(3))
      : 0,
  },
  reviews: {
    total: reviews.length,
    last14Days: reviews.length,
    last7Days: reviewsThisWeek,
    finalCount: reviews.filter((review) => review.status === "final").length,
  },
  preferences: preferences.length,
};

const lines = [
  "# AI 指标",
  "",
  `> 生成时间：${metrics.generatedAt}`,
  "",
  "## AI 反馈",
  "",
  `- 接受计划：${metrics.feedback.planAccepted}`,
  `- 编辑计划：${metrics.feedback.planEdited}`,
  `- 忽略计划：${metrics.feedback.planIgnored}`,
  `- 今日建议有用：${metrics.feedback.suggestionUseful}`,
  `- 今日建议没用：${metrics.feedback.suggestionUseless}`,
  `- AI 修改建议已应用：${metrics.feedback.suggestionApplied}`,
  `- 任务完成：${metrics.feedback.taskCompleted}`,
  `- 任务取消：${metrics.feedback.taskCancelled}`,
  `- 任务延期：${metrics.feedback.taskDelayed}`,
  "",
  "## AI 生成任务",
  "",
  `- 总数：${metrics.aiTasks.total}`,
  `- 未完成：${metrics.aiTasks.open}`,
  `- 已完成：${metrics.aiTasks.done}`,
  `- 已取消：${metrics.aiTasks.cancelled}`,
  `- 完成率：${(metrics.aiTasks.completionRate * 100).toFixed(1)}%`,
  "",
  "## 复盘",
  "",
  `- 近 7 天复盘：${metrics.reviews.last7Days}`,
  `- 近 14 天记录：${metrics.reviews.last14Days}`,
  `- 正式复盘：${metrics.reviews.finalCount}`,
  "",
  "## 偏好",
  "",
  `- 已记录偏好条数：${metrics.preferences}`,
  "",
].join("\n");

const reportPath = path.resolve(import.meta.dirname, "..", "docs", "ai-metrics.md");
fs.writeFileSync(reportPath, lines, "utf8");
console.log(JSON.stringify(metrics, null, 2));
console.log(`\nReport: ${reportPath}`);

await prisma.$disconnect();
