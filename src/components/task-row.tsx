"use client";

import { useOptimistic } from "react";
import {
  CheckCircle2,
  Loader2,
  Play,
  RotateCcw,
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";
import { AiTaskSticky } from "@/components/ai-task-sticky";
import { TaskSettingsMenu } from "@/components/task-settings-menu";
import { FirstTaskReviewHint } from "@/components/first-task-review-hint";
import { markFirstTaskDone, notifyTourStep } from "@/lib/first-run-hints";
import { setTaskStatus } from "@/app/actions";
import { formatDate } from "@/lib/date";

function nextStatus(status: string) {
  if (status === "in_progress") return "done";
  if (status === "done" || status === "cancelled") return "todo";
  return "in_progress";
}

function actionLabel(status: string) {
  if (status === "in_progress") return "下一步";
  if (status === "done") return "重新开始";
  if (status === "cancelled") return "重新开始";
  return "下一步";
}

function statusButtonClass(status: string) {
  if (status === "in_progress") {
    return "zouzou-primary-button inline-flex h-8 min-w-16 items-center justify-center gap-1.5 rounded-md border border-accent bg-accent-soft px-2.5 text-xs font-medium text-accent-strong transition-colors hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-60";
  }
  if (status === "done") {
    return "zouzou-primary-button inline-flex h-8 min-w-16 items-center justify-center gap-1.5 rounded-md border border-success/30 bg-success/10 px-2.5 text-xs font-medium text-success transition-colors hover:bg-success/20 disabled:cursor-not-allowed disabled:opacity-60";
  }
  return "zouzou-secondary-button inline-flex h-8 min-w-16 items-center justify-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-xs font-medium text-ink-secondary transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60";
}

function statusIcon(status: string) {
  if (status === "in_progress") {
    return <Loader2 className="size-3.5" />;
  }
  if (status === "done") {
    return <CheckCircle2 className="size-3.5" />;
  }
  if (status === "cancelled") {
    return <RotateCcw className="size-3.5" />;
  }
  return <Play className="size-3.5" />;
}

function taskHeadline(title: string) {
  const headline = title.split(/[，,。；;！？!\n]/)[0]?.trim() || title;
  return headline.length > 24 ? `${headline.slice(0, 24).trim()}…` : headline;
}

export function TaskRow({
  task,
  projectId,
  showLabels = false,
}: {
  task: {
    id: string;
    title: string;
    notes: string | null;
    status: string;
    priority: string;
    scheduledDate: Date | null;
    dueDate: Date | null;
  };
  projectId: string | null;
  /** 新手期：任务行右侧图标展开成"图标 + 文字" */
  showLabels?: boolean;
}) {
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(task.status);
  const canChangeStatus =
    optimisticStatus !== "done" && optimisticStatus !== "cancelled";

  async function changeStatus(formData: FormData) {
    const next = nextStatus(optimisticStatus);
    formData.set("status", next);
    setOptimisticStatus(next);
    await setTaskStatus(formData);
  }

  return (
    <div className="zouzou-row-hover flex flex-col gap-3 px-4 py-3 transition-colors lg:flex-row lg:items-center">
      <div className="min-w-0 flex-1">
        <div className="group/task-title relative min-w-0">
          <p
            className="truncate font-medium text-ink"
            title={task.notes || task.title}
          >
            {taskHeadline(task.title)}
          </p>
          <p className="pointer-events-none invisible absolute left-0 top-full z-50 mt-1 w-max max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-surface px-3 py-2 text-xs font-normal leading-5 text-ink-secondary opacity-0 shadow-pop transition-opacity group-hover/task-title:visible group-hover/task-title:opacity-100 sm:max-w-[32rem]">
            {task.notes || task.title}
          </p>
        </div>
        <p className="mt-1 truncate text-xs text-ink-secondary">
          {task.notes || "无备注"}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-secondary">
          <StatusBadge status={task.priority} />
          <StatusBadge status={optimisticStatus} />
          {task.scheduledDate ? (
            <span>计划 {formatDate(task.scheduledDate)}</span>
          ) : null}
          {task.dueDate ? (
            <span className="text-danger">截止 {formatDate(task.dueDate)}</span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {canChangeStatus ? (
          <form
            action={changeStatus}
            data-tour="task-next"
            onSubmit={() => {
              const next = nextStatus(optimisticStatus);
              // 引导第 1 步：用户真的点了"下一步"，才进入第 2 步
              if (next === "in_progress") notifyTourStep("3");
              if (next === "done") markFirstTaskDone();
            }}
          >
            <input type="hidden" name="id" value={task.id} />
            <input
              type="hidden"
              name="status"
              value={nextStatus(optimisticStatus)}
            />
            <SubmitButton
              pendingText={null}
              className={statusButtonClass(optimisticStatus)}
            >
              {statusIcon(optimisticStatus)}
              {actionLabel(optimisticStatus)}
            </SubmitButton>
          </form>
        ) : null}

        <div data-tour="task-tools" className="flex items-center gap-2">
          <AiTaskSticky
            taskId={task.id}
            title={task.title}
            notes={task.notes}
            projectName={null}
            status={task.status}
            firstUse
            showLabel={showLabels}
          />

          <TaskSettingsMenu
            taskId={task.id}
            projectId={projectId}
            title={task.title}
            showLabel={showLabels}
          />
        </div>

        <FirstTaskReviewHint />
      </div>
    </div>
  );
}
