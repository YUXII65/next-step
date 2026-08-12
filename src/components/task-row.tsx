import {
  CheckCircle2,
  Loader2,
  Play,
  RotateCcw,
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { SubmitButton } from "@/components/submit-button";
import { AiTaskCoach } from "@/components/ai-task-coach";
import { AiTaskSticky } from "@/components/ai-task-sticky";
import { TaskSettingsMenu } from "@/components/task-settings-menu";
import { FirstTaskReviewHint } from "@/components/first-task-review-hint";
import { markFirstTaskDone } from "@/lib/first-run-hints";
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
    return "inline-flex h-8 min-w-16 items-center justify-center gap-1.5 rounded-md border border-accent bg-accent-soft px-2.5 text-xs font-medium text-accent-strong transition-colors hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-60";
  }
  if (status === "done") {
    return "inline-flex h-8 min-w-16 items-center justify-center gap-1.5 rounded-md border border-success/30 bg-success/10 px-2.5 text-xs font-medium text-success transition-colors hover:bg-success/20 disabled:cursor-not-allowed disabled:opacity-60";
  }
  return "inline-flex h-8 min-w-16 items-center justify-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-xs font-medium text-ink-secondary transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60";
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

export function TaskRow({
  task,
  projectId,
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
}) {
  return (
    <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-ink">{task.title}</p>
        <p className="mt-1 truncate text-xs text-ink-secondary">
          {task.notes || "无备注"}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-ink-secondary">
          <StatusBadge status={task.priority} />
          <StatusBadge status={task.status} />
          {task.scheduledDate ? (
            <span>计划 {formatDate(task.scheduledDate)}</span>
          ) : null}
          {task.dueDate ? (
            <span className="text-danger">截止 {formatDate(task.dueDate)}</span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <form
          action={setTaskStatus}
          onSubmit={() => {
            if (nextStatus(task.status) === "done") markFirstTaskDone();
          }}
        >
          <input type="hidden" name="id" value={task.id} />
          <input type="hidden" name="status" value={nextStatus(task.status)} />
          <SubmitButton
            pendingText="..."
            className={statusButtonClass(task.status)}
          >
            {statusIcon(task.status)}
            {actionLabel(task.status)}
          </SubmitButton>
        </form>

        <AiTaskSticky
          taskId={task.id}
          title={task.title}
          notes={task.notes}
          projectName={null}
          status={task.status}
        />

        <TaskSettingsMenu
          taskId={task.id}
          projectId={projectId}
          title={task.title}
        />

        <AiTaskCoach
          taskId={task.id}
          title={task.title}
          notes={task.notes}
          projectName={null}
          status={task.status}
        />

        <FirstTaskReviewHint />
      </div>
    </div>
  );
}
