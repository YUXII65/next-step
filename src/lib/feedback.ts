import { prisma } from "@/lib/prisma";

export type AiFeedbackInput = {
  userId: string;
  source: string;
  action: string;
  inboxItemId?: string | null;
  taskId?: string | null;
  projectId?: string | null;
  beforeJson?: string | null;
  afterJson?: string | null;
  detail?: string | null;
};

async function syncInferredPreferences(userId: string) {
  const [events, manualPlanScale] = await Promise.all([
    prisma.aiFeedbackEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.userPreference.findFirst({
      where: { key: "plan_scale", source: "manual", userId },
      select: { id: true },
    }),
  ]);

  const planEdited = events.filter(
    (event) => event.action === "plan_edited",
  ).length;
  const taskDelayed = events.filter(
    (event) => event.action === "task_delayed",
  ).length;
  const useless = events.filter(
    (event) => event.action === "suggestion_useless",
  ).length;

  if (
    !manualPlanScale &&
    (planEdited >= 2 || taskDelayed >= 2 || useless >= 2)
  ) {
    await prisma.userPreference.upsert({
      where: {
        userId_key_source: {
          userId,
          key: "plan_scale",
          source: "inferred",
        },
      },
      update: { value: "few" },
      create: {
        userId,
        key: "plan_scale",
        value: "few",
        source: "inferred",
        note: "根据近期编辑、延期或无效反馈自动推断",
      },
    });
  }
}

export async function recordAiFeedback(input: AiFeedbackInput) {
  try {
    await prisma.aiFeedbackEvent.create({
      data: {
        userId: input.userId,
        source: input.source,
        action: input.action,
        inboxItemId: input.inboxItemId ?? null,
        taskId: input.taskId ?? null,
        projectId: input.projectId ?? null,
        beforeJson: input.beforeJson ?? null,
        afterJson: input.afterJson ?? null,
        detail: input.detail ?? null,
      },
    });
    await syncInferredPreferences(input.userId);
  } catch {
    // Feedback recording must never block the main flow.
  }
}
