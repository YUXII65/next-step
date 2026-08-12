"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  FolderKanban,
  ListTodo,
  NotebookPen,
} from "lucide-react";
import { completeFirstRun, skipOnboarding } from "@/app/actions";
import { BrandMark } from "@/components/brand-mark";
import { SubmitButton } from "@/components/submit-button";

const steps = [
  { label: "写想法", icon: NotebookPen },
  { label: "建项目", icon: FolderKanban },
  { label: "定今日", icon: ListTodo },
];

const inputClass =
  "w-full rounded-lg border border-border bg-surface-muted px-3 py-2.5 text-sm leading-6 text-ink outline-none placeholder:text-ink-muted focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent/20";

export function FirstRunGuide() {
  const [step, setStep] = useState(0);
  const [idea, setIdea] = useState("");
  const [projectName, setProjectName] = useState("");
  const [objective, setObjective] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem("next_step_new_user", "1");
    } catch {
      // Ignore storage errors and continue the setup flow.
    }
  }, []);

  const trimmedIdea = idea.trim().replace(/\s+/g, " ");
  const generatedProjectName = trimmedIdea.slice(0, 12) || "第一个项目";
  const generatedObjective =
    trimmedIdea || "把第一个想法变成可推进的个人项目";

  function continueToProject() {
    setProjectName(generatedProjectName);
    setObjective(generatedObjective);
    setStep(1);
  }

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-background">
      <div className="flex min-h-dvh items-center justify-center px-4 py-8">
        <div className="w-full max-w-xl">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BrandMark className="size-8" />
              <div>
                <span className="block text-sm font-semibold text-ink">走走</span>
                <span className="block text-[11px] text-ink-muted">
                  让想法，走成下一步
                </span>
              </div>
            </div>
            <form action={skipOnboarding}>
              <SubmitButton
                pendingText="..."
                className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-surface px-3 text-sm font-medium text-ink-secondary transition-colors hover:border-accent hover:text-accent"
              >
                跳过
              </SubmitButton>
            </form>
          </div>

          <div className="mb-6 grid grid-cols-3 gap-2">
            {steps.map((item, index) => {
              const Icon = item.icon;
              const active = index <= step;

              return (
                <div
                  key={item.label}
                  className={
                    active
                      ? "flex items-center justify-center gap-1.5 rounded-lg bg-accent-soft px-3 py-2 text-xs font-medium text-accent-strong"
                      : "flex items-center justify-center gap-1.5 rounded-lg bg-surface-muted px-3 py-2 text-xs font-medium text-ink-muted"
                  }
                >
                  <Icon className="size-3.5" />
                  <span className="truncate">{item.label}</span>
                </div>
              );
            })}
          </div>

          <div className="rounded-lg border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(23,25,29,0.04)] sm:p-6">
            {step === 0 ? (
              <div>
                <p className="text-sm font-semibold text-ink">
                  今天最想推进什么？
                </p>
                <textarea
                  autoFocus
                  value={idea}
                  onChange={(event) => setIdea(event.target.value)}
                  rows={4}
                  placeholder="比如：整理自己的个人网站"
                  className={`${inputClass} mt-3 resize-none`}
                />
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={continueToProject}
                    disabled={!trimmedIdea}
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    下一步
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div>
                <p className="text-sm font-semibold text-ink">
                  把这个想法放进第一个项目
                </p>
                <label className="mt-4 block">
                  <span className="mb-1.5 block text-xs font-medium text-ink-secondary">
                    项目名
                  </span>
                  <input
                    value={projectName}
                    onChange={(event) => setProjectName(event.target.value)}
                    maxLength={40}
                    className={inputClass}
                  />
                </label>
                <label className="mt-4 block">
                  <span className="mb-1.5 block text-xs font-medium text-ink-secondary">
                    目标
                  </span>
                  <textarea
                    value={objective}
                    onChange={(event) => setObjective(event.target.value)}
                    rows={3}
                    maxLength={200}
                    className={`${inputClass} resize-none`}
                  />
                </label>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="text-sm font-medium text-ink-secondary transition-colors hover:text-accent"
                  >
                    上一步
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!projectName.trim() || !objective.trim()}
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    下一步
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <form action={completeFirstRun}>
                <input type="hidden" name="projectName" value={projectName.trim()} />
                <input type="hidden" name="objective" value={objective.trim()} />
                <input type="hidden" name="taskTitle" value={trimmedIdea} />
                <p className="text-sm font-semibold text-ink">
                  今天先做这一件
                </p>
                <div className="mt-3 flex items-start gap-3 rounded-lg bg-surface-muted p-4">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent-strong">
                    <ListTodo className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">
                      {trimmedIdea}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-ink-secondary">
                      已放入 {projectName}，安排在今日
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex justify-end">
                  <SubmitButton
                    pendingText="正在创建..."
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-strong"
                  >
                    完成，进入今日页
                    <Check className="size-4" />
                  </SubmitButton>
                </div>
              </form>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
