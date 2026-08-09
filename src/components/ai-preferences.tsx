"use client";

import { useEffect, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { getUserPreferences, saveUserPreferences } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";

const inputClass =
  "w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent/20";

export function AiPreferences() {
  const [values, setValues] = useState({
    plan_scale: "balanced",
    default_start_action: "smallest",
    avoid_overdue: "yes",
    project_focus: "",
  });

  useEffect(() => {
    let mounted = true;
    void getUserPreferences().then((preferences) => {
      if (!mounted) return;
      setValues((current) => {
        const next = { ...current };
        for (const preference of preferences) {
          if (preference.key in next) {
            next[preference.key as keyof typeof next] = preference.value;
          }
        }
        return next;
      });
    });
    return () => {
      mounted = false;
    };
  }, []);

  function update(key: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  return (
    <details className="rounded-md border border-border bg-surface">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-2 text-xs font-medium text-ink-secondary transition-colors hover:text-accent">
        <SlidersHorizontal className="size-3.5" />
        AI 偏好
      </summary>
      <form action={saveUserPreferences} className="space-y-3 border-t border-border p-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink-secondary">
            计划规模
          </span>
          <select
            name="plan_scale"
            value={values.plan_scale}
            onChange={(event) => update("plan_scale", event.target.value)}
            className={inputClass}
          >
            <option value="few">少而稳</option>
            <option value="balanced">适中</option>
            <option value="ambitious">可以多排</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink-secondary">
            默认第一步
          </span>
          <select
            name="default_start_action"
            value={values.default_start_action}
            onChange={(event) =>
              update("default_start_action", event.target.value)
            }
            className={inputClass}
          >
            <option value="smallest">最小动作</option>
            <option value="research">先研究再动手</option>
            <option value="complete">完整方案</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink-secondary">
            是否优先避免逾期
          </span>
          <select
            name="avoid_overdue"
            value={values.avoid_overdue}
            onChange={(event) => update("avoid_overdue", event.target.value)}
            className={inputClass}
          >
            <option value="yes">尽量不逾期</option>
            <option value="no">按节奏推进</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink-secondary">
            当前重点项目
          </span>
          <input
            name="project_focus"
            value={values.project_focus}
            onChange={(event) => update("project_focus", event.target.value)}
            placeholder="例如：下一步"
            className={inputClass}
          />
        </label>

        <div className="flex justify-end">
          <SubmitButton
            pendingText="保存中..."
            className="inline-flex h-8 items-center justify-center rounded-md bg-accent px-3 text-xs font-medium text-white transition-colors hover:bg-accent-strong"
          >
            保存偏好
          </SubmitButton>
        </div>
      </form>
    </details>
  );
}
