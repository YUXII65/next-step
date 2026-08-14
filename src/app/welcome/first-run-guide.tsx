"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  FolderKanban,
  ListTodo,
  NotebookPen,
  Sparkles,
} from "lucide-react";
import {
  completeFirstRun,
  planOnboarding,
  skipOnboarding,
} from "@/app/actions";
import { BrandMark } from "@/components/brand-mark";
import { SubmitButton } from "@/components/submit-button";
import type { FirstRunPlanResult } from "@/lib/ai";

const steps = [
  { label: "写想法", icon: NotebookPen },
  { label: "建项目", icon: FolderKanban },
  { label: "定今日", icon: ListTodo },
];

const inputClass =
  "zouzou-input w-full rounded-lg px-3 py-2.5 text-sm leading-6 text-ink";

export function FirstRunGuide({ guest }: { guest?: boolean }) {
  const [step, setStep] = useState(0);
  const [idea, setIdea] = useState("");
  const [projectName, setProjectName] = useState("");
  const [objective, setObjective] = useState("");
  const [milestone, setMilestone] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [plan, setPlan] = useState<FirstRunPlanResult | null>(null);
  const [planSourceIdea, setPlanSourceIdea] = useState("");
  const [generating, setGenerating] = useState(false);
  const [aiFallback, setAiFallback] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("next_step_new_user", "1");
    } catch {
      // Ignore storage errors and continue the setup flow.
    }
  }, []);

  const trimmedIdea = idea.trim().replace(/\s+/g, " ");

  function handleIdeaChange(value: string) {
    setIdea(value);
    setPlan(null);
    setPlanSourceIdea("");
    setAiFallback(false);
  }

  async function continueToProject() {
    if (!trimmedIdea || generating) return;
    if (plan && planSourceIdea === trimmedIdea) {
      setStep(1);
      return;
    }

    setGenerating(true);
    try {
      const nextPlan = await planOnboarding(trimmedIdea);
      setPlan(nextPlan);
      setAiFallback(nextPlan.usedFallback);
      setPlanSourceIdea(trimmedIdea);
      setProjectName(nextPlan.projectName);
      setObjective(nextPlan.objective);
      setMilestone(nextPlan.milestone);
      setTaskTitle(nextPlan.taskTitle);
      setStep(1);
    } catch {
      setAiFallback(true);
      setProjectName(trimmedIdea.slice(0, 12) || "第一个项目");
      setObjective(`把“${trimmedIdea}”推进成今天能做的一件事。`);
      setMilestone("开始推进");
      setTaskTitle(`列出「${trimmedIdea}」今天能做的第一个最小动作`);
      setStep(1);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto">
      <div className="flex min-h-dvh items-center justify-center px-4 py-8">
        <div className="w-full max-w-xl">
          {guest ? (
            <div className="zouzou-panel mb-4 flex items-center justify-between gap-3 rounded-xl border-accent/25 bg-accent-soft px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-accent-strong">
                  游客体验中
                </p>
                <p className="mt-0.5 text-xs leading-5 text-ink-secondary">
                  注册正式账号后，这个体验里的内容可以继续保存。
                </p>
              </div>
              <Link
                href="/guest/register"
                className="zouzou-primary-button inline-flex h-9 shrink-0 items-center rounded-lg bg-accent px-3 text-sm font-medium text-white transition-colors hover:bg-accent-strong"
              >
                注册保存
              </Link>
            </div>
          ) : null}

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
                className="zouzou-secondary-button inline-flex h-9 items-center justify-center rounded-lg border border-border bg-surface px-3 text-sm font-medium text-ink-secondary transition-colors hover:border-accent hover:text-accent"
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

          <div className="zouzou-panel rounded-xl p-5 sm:p-7">
            {step === 0 ? (
              <div>
                <p className="text-sm font-semibold text-ink">
                  今天最想推进什么？
                </p>
                <textarea
                  autoFocus
                  value={idea}
                  onChange={(event) => handleIdeaChange(event.target.value)}
                  rows={4}
                  placeholder="比如：整理自己的个人网站"
                  className={`${inputClass} mt-3 resize-none`}
                />
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={continueToProject}
                    disabled={!trimmedIdea || generating}
                    className="zouzou-primary-button inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {generating ? (
                      <>
                        <Sparkles className="size-4 animate-pulse" />
                        AI 正在整理...
                      </>
                    ) : (
                      <>
                        让 AI 整理
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div>
                <p className="text-sm font-semibold text-ink">
                  把这个想法放进第一个项目
                </p>
                {aiFallback ? (
                  <div className="mt-2 rounded-lg border border-warning/25 bg-warning/10 px-3 py-2 text-xs leading-5 text-warning">
                    AI 暂时不可用，当前使用本地整理，结果可继续修改。
                  </div>
                ) : (
                  <p className="mt-1 text-xs leading-5 text-ink-secondary">
                    AI 已整理，可继续修改。
                  </p>
                )}
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
                <label className="mt-4 block">
                  <span className="mb-1.5 block text-xs font-medium text-ink-secondary">
                    当前里程碑
                  </span>
                  <input
                    value={milestone}
                    onChange={(event) => setMilestone(event.target.value)}
                    maxLength={80}
                    className={inputClass}
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
                    className="zouzou-primary-button inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
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
                <input type="hidden" name="milestone" value={milestone.trim()} />
                <p className="text-sm font-semibold text-ink">
                  今天先做这一件
                </p>
                <label className="mt-3 block">
                  <span className="mb-1.5 block text-xs font-medium text-ink-secondary">
                    今日任务
                  </span>
                  <input
                    name="taskTitle"
                    value={taskTitle}
                    onChange={(event) => setTaskTitle(event.target.value)}
                    maxLength={200}
                    className={inputClass}
                  />
                </label>
                <p className="mt-2 text-xs leading-5 text-ink-secondary">
                  已放入 {projectName}，安排在今日
                </p>
                <div className="mt-5 flex justify-end">
                  <SubmitButton
                    pendingText="正在创建..."
                    disabled={!taskTitle.trim()}
                    className="zouzou-primary-button inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-strong"
                  >
                    完成，去书桌查看
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
