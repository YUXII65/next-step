"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type {
  Priority,
  ProjectStatus,
  TaskStatus,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { endOfDay, startOfDay, toDateInputValue } from "@/lib/date";
import { buildAiContext } from "@/lib/ai-context";
import { recordAiFeedback } from "@/lib/feedback";
import {
  clarifyInbox,
  generateReviewDraft,
  generateTaskCoachAdvice,
  generateTaskEditSuggestion,
  generateProjectEditSuggestion,
  planInbox,
  suggestTodayFocus,
  type InboxPlan,
  type TaskEditSuggestion,
  type TaskCoachAdvice,
  type ProjectEditSuggestion,
  type TodaySuggestion,
} from "@/lib/ai";

const projectStatuses: ProjectStatus[] = [
  "active",
  "paused",
  "completed",
  "archived",
];

const taskStatuses: TaskStatus[] = [
  "todo",
  "in_progress",
  "done",
  "cancelled",
];

const priorities: Priority[] = ["low", "medium", "high", "urgent"];

function text(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function dateInput(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) return null;

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

function dateString(value: string | null | undefined) {
  if (!value) return null;

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

function projectStatus(value: string): ProjectStatus {
  return projectStatuses.includes(value as ProjectStatus)
    ? (value as ProjectStatus)
    : "active";
}

function taskStatus(value: string): TaskStatus {
  return taskStatuses.includes(value as TaskStatus)
    ? (value as TaskStatus)
    : "todo";
}

function priority(value: string): Priority {
  return priorities.includes(value as Priority)
    ? (value as Priority)
    : "medium";
}

function taskReturnTo(value: string | null) {
  if (!value) return null;
  if (
    value === "/workspace" ||
    value.startsWith("/workspace?tab=projects") ||
    value.startsWith("/workspace?project=")
  ) {
    return value;
  }
  return null;
}

function taskSnapshot(task: {
  title: string;
  status: string;
  priority?: string | null;
  scheduledDate?: Date | null;
  dueDate?: Date | null;
  projectId?: string | null;
}) {
  return JSON.stringify({
    title: task.title,
    status: task.status,
    priority: task.priority ?? null,
    scheduledDate: task.scheduledDate
      ? toDateInputValue(task.scheduledDate)
      : null,
    dueDate: task.dueDate ? toDateInputValue(task.dueDate) : null,
    projectId: task.projectId ?? null,
  });
}

function parseInboxPlan(item: { aiPlanJson: string | null }): InboxPlan | null {
  if (!item.aiPlanJson) return null;

  try {
    return JSON.parse(item.aiPlanJson) as InboxPlan;
  } catch {
    return null;
  }
}

export async function addInboxItem(formData: FormData) {
  const content = String(formData.get("content") ?? "").trim();

  if (!content) return;

  await prisma.inboxItem.create({
    data: {
      content,
      source: "manual",
    },
  });

  revalidatePath("/");
  revalidatePath("/workspace");
}

export async function loginWithPassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const nextValue = String(formData.get("next") ?? "/");
  const next =
    nextValue.startsWith("/") && !nextValue.startsWith("//")
      ? nextValue
      : "/";
  const expected = process.env.APP_ACCESS_PASSWORD || "123456";

  if (password !== expected) {
    redirect(
      `/login?error=1&next=${encodeURIComponent(next)}`,
    );
  }

  const cookieStore = await cookies();
  cookieStore.set("workbench_access", expected, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect(next);
}

export async function addInboxItemAndClarify(formData: FormData) {
  const content = String(formData.get("content") ?? "").trim();
  if (!content) return;
  const apiKey = String(formData.get("apiKey") ?? "").trim() || undefined;
  const model = String(formData.get("model") ?? "").trim() || undefined;
  const baseUrl = String(formData.get("baseUrl") ?? "").trim() || undefined;

  const item = await prisma.inboxItem.create({
    data: {
      content,
      source: "manual",
    },
  });

  const projects = await prisma.project.findMany({
    select: {
      name: true,
      objective: true,
      currentMilestone: true,
    },
    orderBy: { name: "asc" },
  });
  const projectContext = projects.map((project) => ({
    name: project.name,
    objective: project.objective,
    currentMilestone: project.currentMilestone,
  }));
  const aiContext = await buildAiContext({
    kind: "inbox_plan",
    inboxItemId: item.id,
  });

  const clarification = await clarifyInbox(
    content,
    projects.map((project) => project.name),
    apiKey,
    model,
    baseUrl,
    projectContext,
    aiContext.summary,
    aiContext.evidence,
  );

  await prisma.inboxItem.update({
    where: { id: item.id },
    data: {
      aiSuggestionJson: JSON.stringify(clarification),
      aiAnalyzedAt: new Date(),
    },
  });

  revalidatePath("/");
  revalidatePath("/workspace");
}

export async function getTaskEditSuggestion(input: {
  taskId?: string;
  title: string;
  notes?: string | null;
  priority?: string;
  scheduledDate?: string | null;
  dueDate?: string | null;
  focusDate?: string | null;
  idea: string;
}): Promise<TaskEditSuggestion> {
  const aiContext = await buildAiContext({
    kind: "task_edit",
    taskId: input.taskId,
  });
  const { taskId: _taskId, ...suggestionInput } = input;
  void _taskId;
  return generateTaskEditSuggestion(
    suggestionInput,
    aiContext.summary,
    aiContext.evidence,
  );
}

export async function getProjectEditSuggestion(input: {
  projectId?: string;
  name: string;
  objective: string;
  currentMilestone?: string | null;
  status?: string;
  notes?: string | null;
  idea: string;
}): Promise<ProjectEditSuggestion> {
  const aiContext = await buildAiContext({
    kind: "project_edit",
    projectId: input.projectId,
  });
  const { projectId: _projectId, ...suggestionInput } = input;
  void _projectId;
  return generateProjectEditSuggestion(
    suggestionInput,
    aiContext.summary,
    aiContext.evidence,
  );
}

export async function getTaskCoachAdvice(input: {
  taskId?: string;
  title: string;
  notes?: string | null;
  projectName?: string | null;
  status?: string;
  message: string;
}): Promise<TaskCoachAdvice> {
  const aiContext = await buildAiContext({
    kind: "task_coach",
    taskId: input.taskId,
  });
  return generateTaskCoachAdvice(
    input,
    aiContext.summary,
    aiContext.evidence,
  );
}

export async function addInboxItemAndPlan(formData: FormData) {
  const content = String(formData.get("content") ?? "").trim();
  if (!content) return;
  const apiKey = String(formData.get("apiKey") ?? "").trim() || undefined;
  const model = String(formData.get("model") ?? "").trim() || undefined;
  const baseUrl = String(formData.get("baseUrl") ?? "").trim() || undefined;

  const item = await prisma.inboxItem.create({
    data: {
      content,
      source: "manual",
    },
  });

  const projects = await prisma.project.findMany({
    select: {
      name: true,
      objective: true,
      currentMilestone: true,
    },
    orderBy: { name: "asc" },
  });
  const projectContext = projects.map((project) => ({
    name: project.name,
    objective: project.objective,
    currentMilestone: project.currentMilestone,
  }));
  const aiContext = await buildAiContext({
    kind: "inbox_plan",
    inboxItemId: item.id,
  });
  const plan = await planInbox(
    content,
    projects.map((project) => project.name),
    apiKey,
    model,
    baseUrl,
    undefined,
    undefined,
    projectContext,
    aiContext.summary,
    undefined,
    aiContext.evidence,
    aiContext.maxPlanTasks,
  );

  await prisma.inboxItem.update({
    where: { id: item.id },
    data: {
      aiPlanJson: JSON.stringify(plan),
      aiAnalyzedAt: new Date(),
    },
  });

  revalidatePath("/");
  revalidatePath("/workspace");
}

export async function convertInboxItemToTask(formData: FormData) {
  const id = text(formData, "id");
  if (!id) return;

  const item = await prisma.inboxItem.findUnique({
    where: { id },
  });

  if (!item || item.status !== "inbox") return;

  const title = item.title ?? item.content;
  const projectId = text(formData, "projectId");
  const priorityValue = priority(String(formData.get("priority") ?? "medium"));
  const dueDate = dateInput(formData, "dueDate");

  await prisma.$transaction([
    prisma.inboxItem.update({
      where: { id },
      data: {
        status: "processed",
        category: "task",
        title,
        projectId,
        priority: priorityValue,
        dueDate,
        processedAt: new Date(),
      },
    }),
    prisma.task.create({
      data: {
        title,
        notes: title === item.content ? null : item.content,
        projectId,
        priority: priorityValue,
        dueDate,
        planOrder: 0,
        inboxItemId: id,
      },
    }),
  ]);

  revalidatePath("/");
  revalidatePath("/workspace");
}

export async function ignoreInboxItem(formData: FormData) {
  const id = text(formData, "id");
  if (!id) return;

  const item = await prisma.inboxItem.findUnique({
    where: { id },
    select: {
      status: true,
      aiSuggestionJson: true,
      aiPlanJson: true,
    },
  });

  if (!item || item.status !== "inbox") return;

  await prisma.inboxItem.update({
    where: { id },
    data: {
      status: "ignored",
      category: "ignore",
      processedAt: new Date(),
    },
  });

  await prisma.aiPlanFeedback.create({
    data: {
      inboxItemId: id,
      action: "ignored",
      planJson:
        item.aiPlanJson ?? item.aiSuggestionJson ?? "{}",
    },
  });
  await recordAiFeedback({
    source: "inbox_plan",
    action: "plan_ignored",
    inboxItemId: id,
    beforeJson: item.aiPlanJson ?? item.aiSuggestionJson ?? "{}",
  });

  revalidatePath("/");
  revalidatePath("/workspace");
}

export async function suggestInboxItem(formData: FormData) {
  const id = text(formData, "id");
  if (!id) return;
  const apiKey = String(formData.get("apiKey") ?? "").trim() || undefined;
  const model = String(formData.get("model") ?? "").trim() || undefined;
  const baseUrl = String(formData.get("baseUrl") ?? "").trim() || undefined;

  const item = await prisma.inboxItem.findUnique({
    where: { id },
    select: { id: true, content: true, status: true },
  });

  if (!item || item.status !== "inbox") return;

  const projects = await prisma.project.findMany({
    select: {
      name: true,
      objective: true,
      currentMilestone: true,
    },
    orderBy: { name: "asc" },
  });
  const aiContext = await buildAiContext({
    kind: "inbox_plan",
    inboxItemId: id,
  });
  const plan = await planInbox(
    item.content,
    projects.map((project) => project.name),
    apiKey,
    model,
    baseUrl,
    undefined,
    undefined,
    projects.map((project) => ({
      name: project.name,
      objective: project.objective,
      currentMilestone: project.currentMilestone,
    })),
    aiContext.summary,
    undefined,
    aiContext.evidence,
    aiContext.maxPlanTasks,
  );

  await prisma.inboxItem.update({
    where: { id },
    data: {
      aiPlanJson: JSON.stringify(plan),
      aiAnalyzedAt: new Date(),
    },
  });

  revalidatePath("/workspace");
}

export async function generateInboxPlan(formData: FormData) {
  const id = text(formData, "id");
  if (!id) return;
  const option = text(formData, "option");
  const supplement = text(formData, "supplement");
  const dimensionChoices = [0, 1, 2, 3]
    .map((index) => text(formData, `choice_${index}`))
    .filter((choice): choice is string => Boolean(choice));
  const apiKey = String(formData.get("apiKey") ?? "").trim() || undefined;
  const model = String(formData.get("model") ?? "").trim() || undefined;
  const baseUrl = String(formData.get("baseUrl") ?? "").trim() || undefined;

  const item = await prisma.inboxItem.findUnique({
    where: { id },
    select: { id: true, content: true, status: true },
  });

  if (!item || item.status !== "inbox") return;

  const projects = await prisma.project.findMany({
    select: {
      name: true,
      objective: true,
      currentMilestone: true,
    },
    orderBy: { name: "asc" },
  });
  const aiContext = await buildAiContext({
    kind: "inbox_plan",
    inboxItemId: item.id,
  });
  const plan = await planInbox(
    item.content,
    projects.map((project) => project.name),
    apiKey,
    model,
    baseUrl,
    option ?? undefined,
    supplement ?? undefined,
    projects.map((project) => ({
      name: project.name,
      objective: project.objective,
      currentMilestone: project.currentMilestone,
    })),
    aiContext.summary,
    dimensionChoices,
    aiContext.evidence,
    aiContext.maxPlanTasks,
  );

  await prisma.inboxItem.update({
    where: { id },
    data: {
      aiPlanJson: JSON.stringify(plan),
      aiAnalyzedAt: new Date(),
    },
  });

  revalidatePath("/");
  revalidatePath("/workspace");
}

export async function confirmInboxPlan(formData: FormData) {
  const id = text(formData, "id");
  if (!id) return;

  const item = await prisma.inboxItem.findUnique({
    where: { id },
  });

  if (!item || item.status !== "inbox" || !item.aiPlanJson) return;

  const plan = parseInboxPlan(item);
  if (!plan || plan.action === "ignore" || !plan.tasks.length) return;

  const projectName = text(formData, "projectName") ?? plan.projectName;
  const projectObjective =
    text(formData, "projectObjective") ?? plan.projectObjective;
  const projectMilestone =
    text(formData, "projectMilestone") ?? plan.projectMilestone;
  const tasks = plan.tasks.map((plannedTask, index) => ({
    title: text(formData, `tasks[${index}].title`) ?? plannedTask.title,
    notes: text(formData, `tasks[${index}].notes`) ?? plannedTask.notes,
    priority: priority(
      String(
        formData.get(`tasks[${index}].priority`) ?? plannedTask.priority,
      ),
    ),
    scheduledDate:
      dateInput(formData, `tasks[${index}].scheduledDate`) ??
      dateString(plannedTask.scheduledDate),
    dueDate:
      dateInput(formData, `tasks[${index}].dueDate`) ??
      dateString(plannedTask.dueDate),
  }));
  const confirmedTasksJson = JSON.stringify(
    tasks.map((task) => ({
      title: task.title,
      notes: task.notes,
      priority: task.priority,
      scheduledDate: task.scheduledDate
        ? toDateInputValue(task.scheduledDate)
        : null,
      dueDate: task.dueDate ? toDateInputValue(task.dueDate) : null,
    })),
  );
  const edited = confirmedTasksJson !== JSON.stringify(plan.tasks);
  let confirmedProjectId: string | null = item.projectId;

  await prisma.$transaction(async (tx) => {
    let projectId = item.projectId;

    if (plan.action === "create_project" && projectName) {
      const project = await tx.project.create({
        data: {
          name: projectName,
          objective: projectObjective ?? "由收件箱想法创建的项目",
          currentMilestone: projectMilestone,
          createdFromInboxItemId: item.id,
        },
      });
      projectId = project.id;
    } else if (plan.action === "existing_project" && projectName) {
      const project = await tx.project.findFirst({
        where: { name: projectName },
        select: { id: true },
      });
      projectId = project?.id ?? projectId;
    }

    const firstTask = tasks[0];
    for (const [index, plannedTask] of tasks.entries()) {
      await tx.task.create({
        data: {
          title: plannedTask.title,
          notes: plannedTask.notes,
          projectId,
          priority: plannedTask.priority,
          scheduledDate: plannedTask.scheduledDate,
          dueDate: plannedTask.dueDate,
          planOrder: index,
          inboxItemId: item.id,
        },
      });
    }

    await tx.inboxItem.update({
      where: { id: item.id },
      data: {
        status: "processed",
        category: "task",
        title: firstTask.title,
        projectId,
        priority: firstTask.priority,
        dueDate: firstTask.dueDate,
        confirmedAt: new Date(),
        processedAt: new Date(),
      },
    });
    confirmedProjectId = projectId;
  });

  await prisma.aiPlanFeedback.create({
    data: {
      inboxItemId: item.id,
      action: "accepted",
      planJson: item.aiPlanJson,
      editedJson: JSON.stringify(tasks),
    },
  });
  await recordAiFeedback({
    source: "inbox_plan",
    action: edited ? "plan_edited" : "plan_accepted",
    inboxItemId: item.id,
    projectId: confirmedProjectId,
    beforeJson: item.aiPlanJson,
    afterJson: confirmedTasksJson,
    detail: edited ? "用户编辑 AI 计划后确认" : "用户直接确认 AI 计划",
  });

  revalidatePath("/");
  revalidatePath("/workspace");
}

export async function generateTodaySuggestion(
  _prevState: TodaySuggestion[],
  _formData: FormData,
) {
  void _prevState;
  void _formData;

  const [tasks, latestReview, activeProjects] = await Promise.all([
    prisma.task.findMany({
      where: {
        status: { in: ["todo", "in_progress"] },
      },
      include: { project: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.review.findFirst({
      select: { summary: true },
      orderBy: { reviewDate: "desc" },
    }),
    prisma.project.findMany({
      where: { status: "active" },
      select: {
        name: true,
        objective: true,
        currentMilestone: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
  ]);

  const aiContext = await buildAiContext({ kind: "today_focus" });
  const suggestions = await suggestTodayFocus(
    tasks.map((task) => ({
      id: task.id,
      title: task.title,
      projectName: task.project?.name ?? null,
      priority: task.priority,
      dueDate: task.dueDate,
      scheduledDate: task.scheduledDate,
    })),
    {
      reviewSummary: latestReview?.summary ?? undefined,
      projects: activeProjects,
    },
    aiContext.summary,
    aiContext.evidence,
  );

  revalidatePath("/");
  return suggestions;
}

export async function getUserPreferences() {
  return prisma.userPreference.findMany({
    select: { key: true, value: true },
    orderBy: { key: "asc" },
  });
}

export async function saveUserPreferences(formData: FormData) {
  const preferenceKeys = [
    "plan_scale",
    "default_start_action",
    "avoid_overdue",
    "project_focus",
  ] as const;

  await prisma.$transaction(
    preferenceKeys.map((key) => {
      const value = String(formData.get(key) ?? "").trim();
      if (!value) {
        return prisma.userPreference.deleteMany({
          where: { key, source: "manual" },
        });
      }
      return prisma.userPreference.upsert({
        where: {
          key_source: {
            key,
            source: "manual",
          },
        },
        update: { value },
        create: {
          key,
          value,
          source: "manual",
        },
      });
    }),
  );

  revalidatePath("/");
}

export async function recordSuggestionFeedback(input: {
  source?: "today_suggestion" | "task_coach" | "review_draft";
  taskId?: string;
  action: "useful" | "useless";
  detail?: string;
}) {
  if (!input.taskId && input.source !== "review_draft") return;
  if (input.action !== "useful" && input.action !== "useless") return;

  await recordAiFeedback({
    source: input.source ?? "today_suggestion",
    action:
      input.action === "useful"
        ? "suggestion_useful"
        : "suggestion_useless",
    taskId: input.taskId ?? null,
    detail: input.detail ?? null,
  });
}

export async function recordEditSuggestionApplied(input: {
  source: "task_edit" | "project_edit";
  taskId?: string;
  projectId?: string;
  beforeJson?: string;
  afterJson?: string;
  detail?: string;
}) {
  await recordAiFeedback({
    source: input.source,
    action: "suggestion_applied",
    taskId: input.taskId ?? null,
    projectId: input.projectId ?? null,
    beforeJson: input.beforeJson ?? null,
    afterJson: input.afterJson ?? null,
    detail: input.detail ?? null,
  });
}

export async function generateReviewDraftAction(formData: FormData) {
  const today = startOfDay();
  const reviewDate = dateInput(formData, "reviewDate") ?? today;
  const dayStart = startOfDay(reviewDate);
  const dayEnd = endOfDay(reviewDate);

  const [completedTasks, openTasks, plannedTasks, activeProjects] =
    await Promise.all([
    prisma.task.findMany({
      where: {
        completedAt: { gte: dayStart, lte: dayEnd },
        status: "done",
      },
      select: { title: true, project: { select: { name: true } } },
      orderBy: { completedAt: "desc" },
    }),
    prisma.task.findMany({
      where: { status: { in: ["todo", "in_progress"] } },
      select: { title: true, project: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.task.findMany({
      where: {
        status: { in: ["todo", "in_progress"] },
        OR: [
          { scheduledDate: { gte: dayStart, lte: dayEnd } },
          { focusDate: { gte: dayStart, lte: dayEnd } },
          { createdAt: { gte: dayStart, lte: dayEnd } },
        ],
      },
      select: { title: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.project.findMany({
      where: { status: "active" },
      select: {
        name: true,
        currentMilestone: true,
        _count: { select: { tasks: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const aiContext = await buildAiContext({ kind: "review" });
  const draft = await generateReviewDraft(
    {
      completed: completedTasks.map((task) => ({
        title: task.title,
        projectName: task.project?.name ?? null,
      })),
      open: openTasks.map((task) => ({
        title: task.title,
        projectName: task.project?.name ?? null,
      })),
      planned: plannedTasks.map((task) => ({ title: task.title })),
      projects: activeProjects.map((project) => ({
        name: project.name,
        currentMilestone: project.currentMilestone,
        taskCount: project._count.tasks,
      })),
    },
    aiContext.evidence,
  );

  await prisma.review.upsert({
    where: { reviewDate },
    update: {
      summary: draft.summary,
      nextActions: draft.nextActions,
      status: "draft",
    },
    create: {
      reviewDate,
      summary: draft.summary,
      nextActions: draft.nextActions,
      status: "draft",
    },
  });

  revalidatePath("/");
  revalidatePath("/review");
}

async function syncReviewRelations(
  review: { id: string; reviewDate: Date },
  nextActionTitles: string[],
) {
  const dayStart = startOfDay(review.reviewDate);
  const dayEnd = endOfDay(review.reviewDate);

  const tasks = await prisma.task.findMany({
    where: {
      OR: [
        { completedAt: { gte: dayStart, lte: dayEnd } },
        { scheduledDate: { gte: dayStart, lte: dayEnd } },
        { focusDate: { gte: dayStart, lte: dayEnd } },
        { createdAt: { gte: dayStart, lte: dayEnd } },
      ],
    },
    include: {
      project: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  for (const task of tasks) {
    await prisma.reviewTask.upsert({
      where: {
        reviewId_taskId: {
          reviewId: review.id,
          taskId: task.id,
        },
      },
      update: {
        titleAtReview: task.title,
        statusAtReview: task.status,
        priorityAtReview: task.priority,
        projectId: task.project?.id ?? null,
      },
      create: {
        reviewId: review.id,
        taskId: task.id,
        titleAtReview: task.title,
        statusAtReview: task.status,
        priorityAtReview: task.priority,
        projectId: task.project?.id ?? null,
      },
    });
  }

  const existingActions = await prisma.reviewNextAction.findMany({
    where: { reviewId: review.id },
    orderBy: { sortOrder: "asc" },
  });

  await prisma.$transaction(async (tx) => {
    for (const [index, title] of nextActionTitles.entries()) {
      const existing = existingActions[index];
      if (existing) {
        await tx.reviewNextAction.update({
          where: { id: existing.id },
          data: { title, status: "pending", sortOrder: index },
        });
        if (existing.taskId) {
          await tx.task.update({
            where: { id: existing.taskId },
            data: { title },
          });
        }
      } else {
        const scheduledDate = new Date(review.reviewDate);
        scheduledDate.setDate(scheduledDate.getDate() + 1);
        const task = await tx.task.create({
          data: {
            title,
            priority: "medium",
            scheduledDate,
          },
        });
        await tx.reviewNextAction.create({
          data: {
            reviewId: review.id,
            title,
            sortOrder: index,
            taskId: task.id,
          },
        });
      }
    }

    for (let index = nextActionTitles.length; index < existingActions.length; index++) {
      const extra = existingActions[index];
      await tx.reviewNextAction.update({
        where: { id: extra.id },
        data: { status: "cancelled" },
      });
    }
  });
}

export async function saveReview(formData: FormData) {
  const id = text(formData, "id");
  const summary = text(formData, "summary");

  if (!id || !summary) return;

  const review = await prisma.review.update({
    where: { id },
    data: {
      summary,
      nextActions: text(formData, "nextActions"),
      status: "final",
    },
  });

  const nextActionTitles = (review.nextActions ?? "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);

  await syncReviewRelations(review, nextActionTitles);

  revalidatePath("/");
  revalidatePath("/review");
  revalidatePath("/workspace");
}

export async function createProject(formData: FormData) {
  const name = text(formData, "name");
  const objective = text(formData, "objective");

  if (!name || !objective) return;

  const project = await prisma.project.create({
    data: {
      name,
      objective,
      status: projectStatus(String(formData.get("status") ?? "active")),
      currentMilestone: text(formData, "currentMilestone"),
      notes: text(formData, "notes"),
    },
  });

  revalidatePath("/");
  revalidatePath("/workspace");
  redirect(`/workspace?project=${project.id}`);
}

export async function updateProject(formData: FormData) {
  const id = text(formData, "id");
  const name = text(formData, "name");
  const objective = text(formData, "objective");

  if (!id || !name || !objective) return;

  await prisma.project.update({
    where: { id },
    data: {
      name,
      objective,
      status: projectStatus(String(formData.get("status") ?? "active")),
      currentMilestone: text(formData, "currentMilestone"),
      notes: text(formData, "notes"),
    },
  });

  revalidatePath("/");
  revalidatePath("/workspace");
}

export async function deleteProject(formData: FormData) {
  const id = text(formData, "id");

  if (!id) return;

  await prisma.project.delete({ where: { id } });

  revalidatePath("/");
  revalidatePath("/workspace");
  redirect("/workspace");
}

export async function createTask(formData: FormData) {
  const title = text(formData, "title");

  if (!title) return;

  const status = taskStatus(String(formData.get("status") ?? "todo"));

  await prisma.task.create({
    data: {
      title,
      notes: text(formData, "notes"),
      projectId: text(formData, "projectId"),
      status,
      priority: priority(String(formData.get("priority") ?? "medium")),
      scheduledDate: dateInput(formData, "scheduledDate"),
      dueDate: dateInput(formData, "dueDate"),
      focusDate: dateInput(formData, "focusDate"),
      completedAt: status === "done" ? new Date() : null,
    },
  });

  revalidatePath("/");
  revalidatePath("/workspace");

  const returnTo = taskReturnTo(text(formData, "returnTo"));
  if (returnTo) redirect(returnTo);
}

export async function updateTask(formData: FormData) {
  const id = text(formData, "id");
  const title = text(formData, "title");

  if (!id || !title) return;

  const existing = await prisma.task.findUnique({
    where: { id },
    select: {
      title: true,
      status: true,
      priority: true,
      scheduledDate: true,
      dueDate: true,
      projectId: true,
      completedAt: true,
      reviewNextAction: { select: { id: true } },
    },
  });

  if (!existing) return;

  const status = taskStatus(String(formData.get("status") ?? "todo"));
  const priorityValue = priority(String(formData.get("priority") ?? "medium"));
  const projectId = text(formData, "projectId");
  const scheduledDate = dateInput(formData, "scheduledDate");
  const dueDate = dateInput(formData, "dueDate");
  const focusDate = dateInput(formData, "focusDate");
  const completedAt =
    status === "done"
      ? new Date()
      : existing.status === "done"
        ? null
        : existing.completedAt;

  await prisma.task.update({
    where: { id },
    data: {
      title,
      notes: text(formData, "notes"),
      projectId,
      status,
      priority: priorityValue,
      scheduledDate,
      dueDate,
      focusDate,
      completedAt,
    },
  });

  const beforeJson = taskSnapshot(existing);
  const afterJson = taskSnapshot({
    title,
    status,
    priority: priorityValue,
    scheduledDate,
    dueDate,
    projectId,
  });
  if (status === "done" && existing.status !== "done") {
    await recordAiFeedback({
      source: "task",
      action: "task_completed",
      taskId: id,
      projectId,
      beforeJson,
      afterJson,
    });
  } else if (status === "cancelled" && existing.status !== "cancelled") {
    await recordAiFeedback({
      source: "task",
      action: "task_cancelled",
      taskId: id,
      projectId,
      beforeJson,
      afterJson,
    });
  } else if (
    existing.dueDate &&
    dueDate &&
    dueDate.getTime() > existing.dueDate.getTime()
  ) {
    await recordAiFeedback({
      source: "task",
      action: "task_delayed",
      taskId: id,
      projectId,
      beforeJson,
      afterJson,
      detail: "用户延后了任务截止日期",
    });
  }

  if (existing.reviewNextAction?.id) {
    await prisma.reviewNextAction.update({
      where: { id: existing.reviewNextAction.id },
      data: {
        status:
          status === "done"
            ? "done"
            : status === "cancelled"
              ? "cancelled"
              : "pending",
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/workspace");

  const returnTo = taskReturnTo(text(formData, "returnTo"));
  if (returnTo) redirect(returnTo);
}

export async function setTaskStatus(formData: FormData) {
  const id = text(formData, "id");
  const status = taskStatus(String(formData.get("status") ?? "todo"));

  if (!id) return;

  const existing = await prisma.task.findUnique({
    where: { id },
    select: {
      title: true,
      status: true,
      priority: true,
      scheduledDate: true,
      dueDate: true,
      projectId: true,
      completedAt: true,
      reviewNextAction: { select: { id: true } },
    },
  });

  if (!existing) return;

  await prisma.task.update({
    where: { id },
    data: {
      status,
      completedAt:
        status === "done"
          ? new Date()
          : existing.status === "done"
            ? null
            : existing.completedAt,
    },
  });

  const beforeJson = taskSnapshot(existing);
  const afterJson = taskSnapshot({
    title: existing.title,
    status,
    priority: existing.priority,
    scheduledDate: existing.scheduledDate,
    dueDate: existing.dueDate,
    projectId: existing.projectId,
  });
  if (status === "done" && existing.status !== "done") {
    await recordAiFeedback({
      source: "task",
      action: "task_completed",
      taskId: id,
      projectId: existing.projectId,
      beforeJson,
      afterJson,
    });
  } else if (status === "cancelled" && existing.status !== "cancelled") {
    await recordAiFeedback({
      source: "task",
      action: "task_cancelled",
      taskId: id,
      projectId: existing.projectId,
      beforeJson,
      afterJson,
    });
  }

  if (existing.reviewNextAction?.id) {
    await prisma.reviewNextAction.update({
      where: { id: existing.reviewNextAction.id },
      data: {
        status:
          status === "done"
            ? "done"
            : status === "cancelled"
              ? "cancelled"
              : "pending",
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/workspace");
}

export async function markTodayFocus(formData: FormData) {
  const id = text(formData, "id");
  if (!id) return;

  const task = await prisma.task.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!task) return;

  await prisma.task.update({
    where: { id },
    data: { focusDate: startOfDay() },
  });

  revalidatePath("/");
  revalidatePath("/workspace");
}

export async function clearTodayFocus(formData: FormData) {
  const id = text(formData, "id");
  if (!id) return;

  const task = await prisma.task.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!task) return;

  await prisma.task.update({
    where: { id },
    data: { focusDate: null },
  });

  revalidatePath("/");
  revalidatePath("/workspace");
}

export async function deleteTask(formData: FormData) {
  const id = text(formData, "id");

  if (!id) return;

  await prisma.task.delete({ where: { id } });

  revalidatePath("/");
  revalidatePath("/workspace");
}
