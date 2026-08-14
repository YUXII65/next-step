"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Check,
  Clock3,
  Lightbulb,
  ListChecks,
  MessageSquareText,
  PencilLine,
  Sparkles,
  Target,
  Wand2,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { startGuestExperience } from "@/app/actions";

type Stage = "capture" | "ask" | "planning" | "prompt" | "received";

type Plan = {
  projectName: string;
  objective: string;
  milestone: string;
  tasks: Array<{
    title: string;
    time: string;
    priority: string;
  }>;
};

const messyThoughts = [
  "我想做一个自己的网站",
  "最近又想学英语",
  "还想开始健身",
  "小红书好像也可以做？",
  "但不知道先做哪个",
  "又怕没时间",
];

const directionOptions = [
  {
    key: "website",
    label: "先做个人网站",
    hint: "想有一个能展示自己的作品",
  },
  {
    key: "english",
    label: "先学英语",
    hint: "更想先把语言能力补起来",
  },
  {
    key: "priority",
    label: "先给想法排优先级",
    hint: "先别急着做，理清更重要",
  },
];

const thoughtPrompts = [
  {
    label: "我想做…",
    placeholder: "比如：我想做一个能展示作品的个人网站。",
  },
  {
    label: "最近让我分心的是…",
    placeholder: "比如：我总在收集素材，但没有真正开始输出。",
  },
  {
    label: "如果这周只做一件事…",
    placeholder: "比如：如果这周只做一件事，我会先完成网站首页。",
  },
  {
    label: "我真正想要的是…",
    placeholder: "比如：我真正想要的不是更多工具，而是有一个能持续完成的项目。",
  },
  {
    label: "一直拖着没开始的是…",
    placeholder: "比如：我一直想整理作品集，但总觉得还没准备好。",
  },
];

const plans: Record<string, Plan> = {
  website: {
    projectName: "个人网站 V1",
    objective: "两周内上线一个能展示作品、说明能力的个人网站。",
    milestone: "本周完成定位和内容，下周完成搭建与上线。",
    tasks: [
      {
        title: "写下网站的一句话定位",
        time: "15 分钟",
        priority: "今日第一步",
      },
      {
        title: "整理 3-5 个代表作品",
        time: "1-2 小时",
        priority: "高",
      },
      {
        title: "选择搭建方式并搭好首页骨架",
        time: "2-3 小时",
        priority: "高",
      },
      {
        title: "补齐联系方式和项目说明",
        time: "30 分钟",
        priority: "中",
      },
    ],
  },
  english: {
    projectName: "英语日常表达计划",
    objective: "三个月内能用英语完成日常对话和短写作。",
    milestone: "前两周建立每日 30 分钟输入习惯，并完成第一轮主题表达。",
    tasks: [
      {
        title: "定一个你最常用的场景主题",
        time: "10 分钟",
        priority: "今日第一步",
      },
      {
        title: "准备 10 个场景短句并朗读",
        time: "20 分钟",
        priority: "高",
      },
      {
        title: "找一个能对话的 AI 练习伙伴",
        time: "15 分钟",
        priority: "中",
      },
      {
        title: "把不会的词整理成一张表",
        time: "20 分钟",
        priority: "低",
      },
    ],
  },
  priority: {
    projectName: "想法优先级整理",
    objective: "先不增加新计划，把现有想法归类，并决定哪些该做、哪些该删。",
    milestone: "本周完成一次个人目标盘点，选出 1 个重点推进项目。",
    tasks: [
      {
        title: "把现有想法按“想做 / 该做 / 可放弃”分类",
        time: "20 分钟",
        priority: "今日第一步",
      },
      {
        title: "选出本周只推进的一件重点",
        time: "10 分钟",
        priority: "高",
      },
      {
        title: "为其他想法设置“暂不处理”状态",
        time: "10 分钟",
        priority: "中",
      },
      {
        title: "写下为什么这件事比别的重要",
        time: "15 分钟",
        priority: "中",
      },
    ],
  },
};

const inputClass =
  "zouzou-input w-full rounded-lg px-3 py-2.5 text-sm leading-6 text-ink";

const primaryButtonClass =
  "zouzou-primary-button inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50";

const secondaryButtonClass =
  "zouzou-secondary-button inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-ink-secondary transition-colors hover:border-accent hover:text-accent";

function getAiQuestion(selected: string | null) {
  if (selected === "website") {
    return "好，先做个人网站。我会先按“两周上线 V1”来规划。再确认一下：这个网站主要是为了找工作、接单，还是记录分享？你可以直接点选，也可以补充两句。";
  }
  if (selected === "english") {
    return "好，先学英语。我不建议一上来就背单词，先确认：你更想先解决日常对话、工作写作，还是看懂英文资料？";
  }
  if (selected === "priority") {
    return "好，先不急着执行。我会帮你把想法分成“想做 / 该做 / 可放弃”，再选出本周真正值得推进的一件事。";
  }
  return "我看到你有很多想做的事。先不急着全部排期，我想先弄清楚：你现在最想推进哪个？";
}

export function OnboardingDemo() {
  const [stage, setStage] = useState<Stage>("capture");
  const [thought, setThought] = useState(messyThoughts.join("\n"));
  const [selected, setSelected] = useState<string | null>(null);
  const [extra, setExtra] = useState("");
  const [promptIndex, setPromptIndex] = useState(0);
  const [userThought, setUserThought] = useState("");
  const [editing, setEditing] = useState(false);

  const plan = selected ? plans[selected] : null;

  function reset() {
    setStage("capture");
    setThought(messyThoughts.join("\n"));
    setSelected(null);
    setExtra("");
    setPromptIndex(0);
    setUserThought("");
    setEditing(false);
  }

  const steps = ["杂乱思绪", "AI 提问", "生成计划", "你的想法"];
  const stageIndex =
    stage === "capture"
      ? 0
      : stage === "ask"
        ? 1
        : stage === "planning"
          ? 2
          : 3;

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto">
      <div className="mx-auto min-h-dvh w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-1.5 rounded-md bg-ai-soft px-2 py-1 text-xs font-medium text-ai">
              <Sparkles className="size-3.5" />
              首次交互演示
            </p>
            <h1 className="text-2xl font-semibold tracking-normal text-ink sm:text-3xl">
              先别整理，先把你脑子里的东西倒出来。
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-secondary">
              你不是不会规划，只是想法太多，少了个人帮你一步步问清楚。
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <Link
              href="/"
              className="zouzou-secondary-button inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-ink-secondary transition-colors hover:border-accent hover:text-accent"
            >
              返回走走
            </Link>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-4 gap-2">
          {steps.map((step, index) => (
            <div
              key={step}
              className={
                index <= stageIndex
                  ? "rounded-lg bg-accent-soft px-3 py-2 text-center text-xs font-medium text-accent-strong"
                  : "rounded-lg bg-surface-muted px-3 py-2 text-center text-xs font-medium text-ink-muted"
              }
            >
              <span className="mr-1.5 hidden sm:inline">{index + 1}.</span>
              {step}
            </div>
          ))}
        </div>

        {stage === "capture" ? (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="zouzou-panel rounded-xl p-5 sm:p-6">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-ink">
                  你的脑子现在大概是这样
                </p>
                <span className="text-xs text-ink-muted">可编辑示例</span>
              </div>
              <textarea
                value={thought}
                onChange={(event) => setThought(event.target.value)}
                rows={9}
                className="zouzou-input min-h-52 resize-none px-4 py-3 text-base leading-7 text-ink"
              />
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStage("ask")}
                  className={primaryButtonClass}
                >
                  <Wand2 className="size-4" />
                  让 AI 看看这些想法
                </button>
              </div>
            </div>

            <aside className="zouzou-panel rounded-xl p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-white">
                  <MessageSquareText className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">你不需要自己整理</p>
                  <p className="mt-1 text-sm leading-6 text-ink-secondary">
                    不用先建项目，不用写清楚任务，也不用懂怎么给 AI 下指令。
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {messyThoughts.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-2 text-sm leading-6 text-ink-secondary"
                  >
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                    {item}
                  </div>
                ))}
              </div>

              <p className="zouzou-ai-card mt-6 px-3 py-2.5 text-xs leading-5 text-accent-strong">
                AI 会先问关键问题，再给出可编辑的计划，而不是直接丢给你一堆任务。
              </p>
            </aside>
          </section>
        ) : null}

        {stage === "ask" ? (
          <section className="zouzou-panel rounded-xl p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-white">
                <Sparkles className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">AI 规划助手</p>
                <p className="mt-2 text-base leading-7 text-ink">
                  {getAiQuestion(selected)}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {directionOptions.map((option) => {
                const active = selected === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => {
                      setSelected(option.key);
                    }}
                    className={
                      active
                        ? "rounded-lg border-2 border-accent bg-accent-soft px-4 py-3 text-left transition-colors"
                        : "rounded-lg border border-border bg-surface-muted px-4 py-3 text-left transition-colors hover:border-accent hover:bg-accent-soft/50"
                    }
                  >
                    <span className="flex items-center justify-between gap-2 text-sm font-medium text-ink">
                      {option.label}
                      {active ? <Check className="size-4 text-accent" /> : null}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-ink-secondary">
                      {option.hint}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="zouzou-panel mt-6 rounded-xl bg-surface-muted p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-ink">
                <ArrowDown className="size-4 text-accent" />
                也可以补充两句，让计划更贴近你
              </div>
              <textarea
                value={extra}
                onChange={(event) => setExtra(event.target.value)}
                rows={3}
                placeholder={
                  selected === "website"
                    ? "比如：我想用它找工作，所以作品展示比技术博客更重要。"
                    : selected === "english"
                      ? "比如：我更想解决日常交流，不想一上来就背单词。"
                      : "比如：我觉得自己想法太多，但真正做完的项目很少。"
                }
                className={`${inputClass} mt-3`}
              />
              {extra.trim() ? (
                <p className="mt-2 text-xs leading-5 text-ink-secondary">
                  你补充了：“{extra.trim()}”
                </p>
              ) : (
                <p className="mt-2 text-xs leading-5 text-ink-muted">
                  不填也可以，直接选一个方向继续。
                </p>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStage("prompt")}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-secondary transition-colors hover:text-accent"
              >
                <Lightbulb className="size-4" />
                我还没想清楚，换一种方式引导我
              </button>
              <button
                type="button"
                onClick={() => setStage("planning")}
                disabled={!selected}
                className={primaryButtonClass}
              >
                按这个方向生成计划
                <ArrowRight className="size-4" />
              </button>
            </div>
          </section>
        ) : null}

        {stage === "planning" && plan ? (
          <section className="zouzou-panel rounded-xl p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-ink">
                  这是 AI 根据你的选择生成的第一版计划
                </p>
                <p className="mt-1 text-sm leading-6 text-ink-secondary">
                  所有内容都可以修改。这个演示页不会写入真实数据。
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing((value) => !value)}
                className={secondaryButtonClass}
              >
                <PencilLine className="size-4" />
                {editing ? "完成编辑" : "编辑计划"}
              </button>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-ink-secondary">
                    项目名称
                  </span>
                  <input
                    key={`${selected}-${editing}-name`}
                    defaultValue={plan.projectName}
                    readOnly={!editing}
                    className={`${inputClass} ${
                      editing ? "" : "cursor-default border-transparent bg-transparent"
                    }`}
                  />
                </label>
                <label className="mt-4 block">
                  <span className="mb-1.5 block text-xs font-medium text-ink-secondary">
                    项目目标
                  </span>
                  <textarea
                    key={`${selected}-${editing}-objective`}
                    defaultValue={plan.objective}
                    readOnly={!editing}
                    rows={2}
                    className={`${inputClass} ${
                      editing ? "" : "cursor-default border-transparent bg-transparent"
                    }`}
                  />
                </label>
                <label className="mt-4 block">
                  <span className="mb-1.5 block text-xs font-medium text-ink-secondary">
                    当前里程碑
                  </span>
                  <input
                    key={`${selected}-${editing}-milestone`}
                    defaultValue={plan.milestone}
                    readOnly={!editing}
                    className={`${inputClass} ${
                      editing ? "" : "cursor-default border-transparent bg-transparent"
                    }`}
                  />
                </label>

                {extra.trim() ? (
                  <div className="zouzou-ai-card mt-4 px-3 py-2.5 text-xs leading-5 text-accent-strong">
                    已纳入你的补充：“{extra.trim()}”
                  </div>
                ) : null}
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-ink">
                  <ListChecks className="size-4 text-accent" />
                  本周任务
                </div>
                <div className="zouzou-panel mt-3 divide-y divide-border rounded-xl bg-surface-muted">
                  {plan.tasks.map((task, index) => (
                    <div
                      key={`${task.title}-${index}`}
                      className="flex items-center justify-between gap-3 px-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">
                          {index + 1}. {task.title}
                        </p>
                        <p className="mt-1 text-xs text-ink-secondary">
                          {task.priority}
                        </p>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-surface px-2 py-1 text-xs font-medium text-ink-secondary">
                        <Clock3 className="size-3.5" />
                        {task.time}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-start gap-2 rounded-lg bg-success/10 px-3 py-3 text-sm leading-6 text-success">
                  <Target className="mt-1 size-4 shrink-0" />
                  今日第一步：用 15 分钟完成第 1 条任务，不用做更多。
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setStage("ask")}
                className={secondaryButtonClass}
              >
                换一个方向重新问
              </button>
              <Link
                href="/login?mode=register&next=/welcome"
                className={secondaryButtonClass}
              >
                注册并保存
              </Link>
              <form action={startGuestExperience}>
                <button type="submit" className={primaryButtonClass}>
                  <Check className="size-4" />
                  先游客体验
                  <ArrowRight className="size-4" />
                </button>
              </form>
            </div>
            <p className="mt-3 text-right text-xs leading-5 text-ink-secondary">
              演示已完成，可以先体验，也可以注册账号保存。
            </p>
          </section>
        ) : null}

        {stage === "prompt" ? (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="zouzou-panel rounded-xl p-5 sm:p-6">
              <p className="text-sm font-semibold text-ink">
                如果你还没想清楚，试着换一种问法
              </p>
              <p className="mt-1 text-sm leading-6 text-ink-secondary">
                选一个提示词，从你最自然的表达开始。
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {thoughtPrompts.map((prompt, index) => {
                  const active = promptIndex === index;
                  return (
                    <button
                      key={prompt.label}
                      type="button"
                      onClick={() => setPromptIndex(index)}
                      className={
                        active
                          ? "rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition-colors"
                          : "rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm font-medium text-ink-secondary transition-colors hover:border-accent hover:text-accent"
                      }
                    >
                      {prompt.label}
                    </button>
                  );
                })}
              </div>

              <textarea
                value={userThought}
                onChange={(event) => setUserThought(event.target.value)}
                rows={7}
                placeholder={thoughtPrompts[promptIndex].placeholder}
                className="zouzou-input mt-5 min-h-44 w-full resize-none px-4 py-3 text-base leading-7 text-ink"
              />

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStage("ask")}
                  className="text-sm font-medium text-ink-secondary transition-colors hover:text-accent"
                >
                  ← 返回 AI 提问
                </button>
                <button
                  type="button"
                  onClick={() => setStage("received")}
                  disabled={!userThought.trim()}
                  className={primaryButtonClass}
                >
                  <Wand2 className="size-4" />
                  让 AI 帮我整理
                </button>
              </div>
            </div>

            <aside className="zouzou-panel rounded-xl p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-strong">
                  <Lightbulb className="size-4" />
                </span>
                <p className="text-sm leading-6 text-ink-secondary">
                  提示词不是给 AI 用的，是给你自己用的。换一种说法，可能会让你想起真正在意的事。
                </p>
              </div>
            </aside>
          </section>
        ) : null}

        {stage === "received" ? (
          <section className="zouzou-panel mx-auto max-w-2xl rounded-xl p-6 text-center sm:p-8">
            <span className="mx-auto flex size-12 items-center justify-center rounded-lg bg-accent text-white">
              <Sparkles className="size-5" />
            </span>
            <h2 className="mt-5 text-xl font-semibold text-ink">
              我已经收到你的方向
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-ink">
              “{userThought.trim()}”
            </p>
            <p className="mt-4 text-sm leading-6 text-ink-secondary">
              AI 接下来会先确认目标、时间投入和期望结果，再生成可编辑的计划，不会直接替你决定。
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={reset}
                className={secondaryButtonClass}
              >
                重新演示一次
              </button>
              <Link
                href="/login?mode=register&next=/welcome"
                className={secondaryButtonClass}
              >
                注册并保存
              </Link>
              <form action={startGuestExperience}>
                <button type="submit" className={primaryButtonClass}>
                  先游客体验
                  <ArrowRight className="size-4" />
                </button>
              </form>
            </div>
            <p className="mt-3 text-xs leading-5 text-ink-secondary">
              演示已完成，可以先体验，也可以注册账号保存。
            </p>
          </section>
        ) : null}
      </div>
    </div>
  );
}
