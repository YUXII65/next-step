"use client";

import Link from "next/link";
import { PencilLine, Settings2, Trash2 } from "lucide-react";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { deleteTask } from "@/app/actions";
import { useClickOutside } from "@/lib/use-click-outside";

function editHref(projectId: string | null, taskId: string) {
  const params = new URLSearchParams();
  if (projectId) params.set("project", projectId);
  params.set("edit", taskId);
  return `/workspace?${params.toString()}`;
}

export function TaskSettingsMenu({
  taskId,
  projectId,
  title,
  showLabel = false,
}: {
  taskId: string;
  projectId: string | null;
  title: string;
  showLabel?: boolean;
}) {
  const { ref, open, setOpen } = useClickOutside<HTMLDivElement>();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="任务设置"
        title="任务设置"
        className={
          showLabel
            ? "flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-xs font-medium text-ink-secondary transition-colors hover:border-accent hover:text-accent"
            : "flex size-8 items-center justify-center rounded-md border border-border bg-surface text-ink-secondary transition-colors hover:border-accent hover:text-accent"
        }
      >
        <Settings2 className="size-3.5" />
        {showLabel ? <span>设置</span> : null}
      </button>

      {open ? (
        <div className="zouzou-panel absolute right-0 top-10 z-30 w-44 rounded-xl p-1.5 shadow-pop animate-[zouzou-fade-in_240ms_ease-out]">
          <Link
            href={editHref(projectId, taskId)}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-ink-secondary transition-colors hover:bg-surface-muted hover:text-ink"
          >
            <PencilLine className="size-3.5" />
            编辑
          </Link>
          <ConfirmActionButton
            action={deleteTask}
            id={taskId}
            confirmText={`确定删除任务“${title}”？`}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-danger transition-colors hover:bg-danger/10"
          >
            <Trash2 className="size-3.5" />
            删除
          </ConfirmActionButton>
        </div>
      ) : null}
    </div>
  );
}
