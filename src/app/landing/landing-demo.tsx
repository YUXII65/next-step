"use client";

import { useEffect, useState } from "react";
import { Check, ListTodo, NotebookPen, Sparkles, Target } from "lucide-react";
import { cx } from "@/lib/utils";

type DemoTask = {
  title: string;
  time: string;
};

type DemoPlan = {
  focus: string;
  projectName: string;
  objective: string;
  tasks: DemoTask[];
  nextStep: string;
};

function firstLine(value: string) {
  const line =
    value
      .split(/\r?\n/)
      .map((item) => item.trim())
      .find(Boolean) ?? "这件事";
  return line.length > 22 ? `${line.slice(0, 22)}…` : line;
}

function buildDemoPlan(idea: string): DemoPlan {
  const lower = idea.toLowerCase();

  if (/(网站|作品集|个人主页|博客)/.test(lower)) {
    return {
      focus: "个人网站",
      projectName: "个人网站第一步",
      objective: "先确认这个网站最想帮谁、解决什么问题，再决定做成什么样。",
      tasks: [
        { title: "写下这个网站最想帮谁、做什么", time: "10 分钟" },
        { title: "只放一个最想展示的作品或页面", time: "30 分钟" },
        { title: "把“先不做”的部分列出来", time: "5 分钟" },
      ],
      nextStep: "先写下网站最想帮谁、做什么",
    };
  }

  if (/(英语|英文|口语|雅思|托福)/.test(lower)) {
    return {
      focus: "英语表达",
      projectName: "英语日常表达",
      objective: "先解决一个你实际会遇到的场景，而不是从背单词开始。",
      tasks: [
        { title: "选一个你最常用的真实场景", time: "10 分钟" },
        { title: "准备 10 个这个场景会用的短句", time: "20 分钟" },
        { title: "挑一句今天说一遍", time: "5 分钟" },
      ],
      nextStep: "先选一个你最常用的真实场景",
    };
  }

  if (/(健身|运动|跑步|减脂|增肌|锻炼)/.test(lower)) {
    return {
      focus: "身体状态",
      projectName: "日常健身启动",
      objective: "把运动变成一件不用纠结就能开始的小事，先建立稳定节奏。",
      tasks: [
        { title: "定一个最容易开始的时间和动作", time: "10 分钟" },
        { title: "只做 15 分钟，不要求练得多完整", time: "15 分钟" },
        { title: "记录今天做完后的身体感受", time: "5 分钟" },
      ],
      nextStep: "先定一个最容易开始的时间和动作",
    };
  }

  if (/(小红书|抖音|自媒体|视频|账号|公众号)/.test(lower)) {
    return {
      focus: "内容账号",
      projectName: "内容账号启动",
      objective: "先找到一个能持续输出的方向，再完成第一期可发布的样稿。",
      tasks: [
        { title: "选一个你最想持续聊的方向", time: "10 分钟" },
        { title: "写下这个方向能帮到谁、解决什么问题", time: "15 分钟" },
        { title: "写第一期开头，不用写完整篇", time: "30 分钟" },
      ],
      nextStep: "先选一个你最想持续聊的方向",
    };
  }

  return {
    focus: firstLine(idea),
    projectName: `${firstLine(idea)}第一步`,
    objective: `把“${firstLine(idea)}”推进成一件今天能开始的小事，先不看完整目标。`,
    tasks: [
      { title: `写下“${firstLine(idea)}”今天能做的第一个动作`, time: "10 分钟" },
      { title: "只做这个动作 15 分钟，不做完整计划", time: "15 分钟" },
      { title: "把做完的结果或卡住的地方记下来", time: "5 分钟" },
    ],
    nextStep: `先写下“${firstLine(idea)}”今天能做的第一个动作`,
  };
}

const EXAMPLE_IDEA =
  "我想做个个人网站，又想学英语，还想开始健身，但每天下班后已经很累，不知道先做哪个";
const PLAN = buildDemoPlan(EXAMPLE_IDEA);
const STEPS = ["先聊清楚", "拆出计划", "推进与复盘"];
const STEP_MS = 4600;

export function LandingDemo() {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const id = window.setInterval(
      () => setStage((current) => (current + 1) % STEPS.length),
      STEP_MS,
    );
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="mt-6">
      <div className="mb-4 grid grid-cols-3 gap-2">
        {STEPS.map((step, index) => {
          const active = index === stage;
          const done = index < stage;
          return (
            <button
              key={step}
              type="button"
              onClick={() => setStage(index)}
              className={cx(
                "flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                active
                  ? "bg-accent-soft text-accent-strong"
                  : done
                    ? "bg-surface-muted text-ink-secondary"
                    : "bg-surface-muted text-ink-muted",
              )}
            >
              {done ? <Check className="size-3.5" /> : <span>{index + 1}.</span>}
              <span className="truncate">{step}</span>
            </button>
          );
        })}
      </div>

      <div className="zouzou-panel min-h-[300px] rounded-xl bg-surface-muted p-4 sm:p-5">
        {stage === 0 ? (
          <div
            key="clarify"
            className="animate-[zouzou-fade-in_400ms_ease-out]"
          >
            <div className="space-y-3">
              <div className="flex justify-end">
                <div className="max-w-[86%] rounded-xl rounded-tr-sm bg-accent px-3 py-2.5 text-sm leading-6 text-white">
                  {EXAMPLE_IDEA}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent-strong">
                  <Sparkles className="size-3.5" />
                </span>
                <div className="rounded-xl rounded-tl-sm border border-border/70 bg-surface px-3 py-2.5 text-sm leading-6 text-ink">
                  我听到你真正想推进的是「做一个自己的网站」。先不急，我想确认你这次最想先得到什么？
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pl-8">
                {["先做个人网站", "先学英语", "先开始健身"].map((option) => {
                  const active = option === "先做个人网站";
                  return (
                    <span
                      key={option}
                      className={cx(
                        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium",
                        active
                          ? "border-accent bg-accent-soft text-accent-strong"
                          : "border-border bg-surface text-ink-secondary",
                      )}
                    >
                      {active ? <Check className="size-3.5" /> : null}
                      {option}
                    </span>
                  );
                })}
              </div>
              <div className="flex justify-end">
                <div className="max-w-[70%] rounded-xl rounded-tr-sm bg-accent px-3 py-2 text-sm text-white">
                  那就先做个人网站
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent-strong">
                  <Sparkles className="size-3.5" />
                </span>
                <div className="rounded-xl rounded-tl-sm border border-border/70 bg-surface px-3 py-2.5 text-sm leading-6 text-ink">
                  好。那你希望先做出能看的一版，还是先把方向和内容定清楚？
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pl-8">
                {["先做成能展示的一版", "先把内容定清楚"].map((option) => {
                  const active = option === "先做成能展示的一版";
                  return (
                    <span
                      key={option}
                      className={cx(
                        "inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium",
                        active
                          ? "border-accent bg-accent-soft text-accent-strong"
                          : "border-border bg-surface text-ink-secondary",
                      )}
                    >
                      {active ? <Check className="size-3.5" /> : null}
                      {option}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {stage === 1 ? (
          <div
            key="plan"
            className="animate-[zouzou-fade-in_400ms_ease-out]"
          >
            <div className="flex items-center gap-2 text-xs font-medium text-ink-secondary">
              <Sparkles className="size-3.5 text-accent" />
              推进伙伴
            </div>
            <p className="mt-2 text-sm leading-6 text-ink">
              好，先做个人网站。我把它拆成今天能开始的一步。
            </p>
            <p className="mt-4 text-sm font-semibold text-ink">
              {PLAN.projectName}
            </p>
            <p className="mt-1 text-xs leading-5 text-ink-secondary">
              {PLAN.objective}
            </p>
            <div className="mt-4 space-y-2">
              {PLAN.tasks.map((task, index) => (
                <div
                  key={task.title}
                  className="flex items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Check className="size-4 shrink-0 text-success" />
                    <span className="truncate text-sm text-ink">
                      {index + 1}. {task.title}
                    </span>
                  </div>
                  <span className="shrink-0 text-xs text-ink-muted">
                    {task.time}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 flex items-start gap-2 rounded-lg bg-success/10 px-3 py-2.5 text-xs leading-5 text-success">
              <Target className="mt-0.5 size-4 shrink-0" />
              今日第一步：{PLAN.nextStep}
            </p>
          </div>
        ) : null}

        {stage === 2 ? (
          <div
            key="loop"
            className="animate-[zouzou-fade-in_400ms_ease-out]"
          >
            <div className="flex items-center justify-between text-xs font-medium text-ink-secondary">
              <span className="inline-flex items-center gap-1.5">
                <ListTodo className="size-3.5 text-accent" />
                今日推进
              </span>
              <span>1/3 完成</span>
            </div>
            <div className="mt-2 space-y-2">
              {PLAN.tasks.map((task, index) => {
                const status = index === 0 ? "done" : index === 1 ? "doing" : "todo";
                return (
                  <div
                    key={task.title}
                    className="flex items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2.5"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      {status === "done" ? (
                        <Check className="size-4 shrink-0 text-success" />
                      ) : status === "doing" ? (
                        <span className="size-2 shrink-0 animate-[zouzou-soft-pulse_1s_ease-in-out_infinite] rounded-full bg-accent" />
                      ) : (
                        <span className="size-2 shrink-0 rounded-full border border-ink-muted" />
                      )}
                      <span className="truncate text-sm text-ink">
                        {task.title}
                      </span>
                    </div>
                    <span className="shrink-0 text-xs text-ink-muted">
                      {status === "done"
                        ? "已完成"
                        : status === "doing"
                          ? "进行中"
                          : "待办"}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 rounded-xl border border-border/70 bg-surface px-3 py-2.5">
              <div className="flex items-center gap-2 text-xs font-medium text-ink-secondary">
                <NotebookPen className="size-3.5 text-accent" />
                今晚复盘
              </div>
              <p className="mt-1 text-sm leading-6 text-ink">
                今天真正推进的是网站首页，卡在内容还没定。明天把它拆小一点。
              </p>
              <p className="mt-1 text-xs text-success">
                明日第一步：先把网站内容结构列成 3 条。
              </p>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-accent-soft px-3 py-3 text-sm font-medium text-accent-strong">
              <Target className="size-4" />
              有想法，当然可以实现。
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
