import type { ProjectStatus } from "@prisma/client";
import { AiProjectEditAssistant } from "@/components/ai-project-edit-assistant";
import { SubmitButton } from "@/components/submit-button";

const statusOptions = [
  { value: "active", label: "进行中" },
  { value: "paused", label: "已暂停" },
  { value: "completed", label: "已完成" },
  { value: "archived", label: "已归档" },
];

const inputClass =
  "zouzou-input w-full rounded-lg px-3 py-2 text-sm text-ink";

export function ProjectForm({
  action,
  project,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  project?: {
    id: string;
    name: string;
    objective: string;
    status: ProjectStatus;
    currentMilestone: string | null;
    notes: string | null;
  };
  submitLabel: string;
}) {
  const id = project?.id ?? "new";

  return (
    <form action={action} className="space-y-4 p-4">
      {project ? <input type="hidden" name="id" value={project.id} /> : null}
      <input
        type="hidden"
        name="notes"
        id={`project-notes-${id}`}
        defaultValue={project?.notes ?? ""}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label
            htmlFor={`project-name-${id}`}
            className="mb-1.5 block text-xs font-medium text-ink-secondary"
          >
            项目名称
          </label>
          <input
            id={`project-name-${id}`}
            name="name"
            required
            defaultValue={project?.name}
            placeholder="例如：个人网站"
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor={`project-objective-${id}`}
            className="mb-1.5 block text-xs font-medium text-ink-secondary"
          >
            项目目标
          </label>
          <textarea
            id={`project-objective-${id}`}
            name="objective"
            required
            rows={3}
            defaultValue={project?.objective}
            placeholder="这个项目希望达成什么结果"
            className={inputClass}
          />
        </div>

        {project ? (
          <div className="sm:col-span-2">
            <details className="zouzou-panel rounded-xl bg-surface">
              <summary className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-2 text-xs font-medium text-ink-secondary transition-colors hover:text-accent">
                AI 帮助
              </summary>
              <div className="border-t border-border p-3">
                <AiProjectEditAssistant
                  fieldPrefix={id}
                  projectId={project.id}
                />
              </div>
            </details>
          </div>
        ) : null}

        <div>
          <label
            htmlFor={`project-status-${id}`}
            className="mb-1.5 block text-xs font-medium text-ink-secondary"
          >
            状态
          </label>
          <select
            id={`project-status-${id}`}
            name="status"
            defaultValue={project?.status ?? "active"}
            className={inputClass}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor={`project-milestone-${id}`}
            className="mb-1.5 block text-xs font-medium text-ink-secondary"
          >
            当前里程碑
          </label>
          <input
            id={`project-milestone-${id}`}
            name="currentMilestone"
            defaultValue={project?.currentMilestone ?? ""}
            placeholder="例如：完成 Stage 2"
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <SubmitButton className="zouzou-primary-button inline-flex h-9 items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60">
          {submitLabel}
        </SubmitButton>
      </div>
    </form>
  );
}
