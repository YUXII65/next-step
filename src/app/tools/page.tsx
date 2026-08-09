import type { Metadata } from "next";
import { ToolboxDemo } from "./toolbox-demo";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "工具匣",
  description: "按需启用小工具，保持核心闭环简单。",
};

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay() || 7;
  copy.setDate(copy.getDate() - day + 1);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export default async function ToolsPage() {
  const now = new Date();
  const [tasks, activeProjects, reviews, pendingInbox, feedbackCount] =
    await Promise.all([
      prisma.task.findMany({ select: { status: true } }),
      prisma.project.findMany({
        where: { status: "active" },
        select: {
          name: true,
          currentMilestone: true,
          updatedAt: true,
          tasks: {
            select: { updatedAt: true, status: true },
          },
          reviewTasks: {
            select: {
              review: { select: { reviewDate: true } },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.review.findMany({
        include: {
          tasks: {
            select: {
              statusAtReview: true,
              project: { select: { name: true } },
            },
          },
        },
        orderBy: { reviewDate: "desc" },
        take: 14,
      }),
      prisma.inboxItem.count({ where: { status: "inbox" } }),
      prisma.aiFeedbackEvent.count(),
    ]);

  const openTasks = tasks.filter(
    (task) => task.status === "todo" || task.status === "in_progress",
  ).length;
  const doneTasks = tasks.filter((task) => task.status === "done").length;

  const stalledProjects = activeProjects
    .map((project) => {
      const dates = [
        project.updatedAt,
        ...project.tasks.map((task) => task.updatedAt),
        ...project.reviewTasks.map((item) => item.review.reviewDate),
      ];
      const latest = new Date(
        Math.max(...dates.map((date) => date.getTime())),
      );
      const days = Math.max(
        0,
        Math.floor((now.getTime() - latest.getTime()) / DAY_MS),
      );
      return {
        name: project.name,
        milestone: project.currentMilestone,
        days,
      };
    })
    .filter((project) => project.days >= 3)
    .sort((a, b) => b.days - a.days);

  const weekStart = startOfWeek(new Date());
  const weekReviews = reviews.filter(
    (review) => review.reviewDate >= weekStart,
  );
  const weekCompleted = weekReviews.flatMap((review) =>
    review.tasks.filter((task) => task.statusAtReview === "done"),
  ).length;
  const weekOpen = weekReviews.flatMap((review) =>
    review.tasks.filter(
      (task) =>
        task.statusAtReview !== "done" &&
        task.statusAtReview !== "cancelled",
    ),
  ).length;
  const weekProjects = Array.from(
    new Set(
      weekReviews
        .flatMap((review) => review.tasks)
        .map((task) => task.project?.name)
        .filter((name): name is string => Boolean(name)),
    ),
  ).length;

  return (
    <ToolboxDemo
      initialData={{
        pendingInbox,
        openTasks,
        doneTasks,
        feedbackCount,
        stalledProjects,
        weekReviewCount: weekReviews.length,
        weekCompleted,
        weekOpen,
        weekProjects,
      }}
    />
  );
}
