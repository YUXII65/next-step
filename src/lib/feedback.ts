import { prisma } from "@/lib/prisma";

export type AiFeedbackInput = {
  source: string;
  action: string;
  inboxItemId?: string | null;
  taskId?: string | null;
  projectId?: string | null;
  beforeJson?: string | null;
  afterJson?: string | null;
  detail?: string | null;
};

async function syncInferredPreferences() {
  const [events, manualPlanScale] = await Promise.all([
    prisma.aiFeedbackEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.userPreference.findFirst({
      where: { key: "plan_scale", source: "manual" },
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
        key_source: {
          key: "plan_scale",
          source: "inferred",
        },
      },
      update: { value: "few" },
      create: {
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
    await syncInferredPreferences();
  } catch {
    // Feedback recording must never block the main flow.
  }
}
