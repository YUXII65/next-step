"use client";

import { useState } from "react";
import { Check, Sparkles, Wand2 } from "lucide-react";

const tasks = [
  {
    title: "写下网站的一句话定位",
    time: "15 分钟",
  },
  {
    title: "整理 3-5 个代表作品",
    time: "1-2 小时",
  },
  {
    title: "选择搭建方式并搭好首页骨架",
    time: "2-3 小时",
  },
];

export function LandingDemo() {
  const [idea, setIdea] = useState(
    "我想做个个人网站，又想学英语，还想开始健身，但不知道先做哪个",
  );
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="zouzou-panel rounded-xl bg-surface-muted p-4">
        <label
          htmlFor="landing-idea"
          className="mb-2 block text-xs font-medium text-ink-secondary"
        >
          输入一句真实想法
        </label>
        <textarea
          id="landing-idea"
          value={idea}
          onChange={(event) => {
            setIdea(event.target.value);
            setSubmitted(false);
          }}
          rows={4}
          className="zouzou-input w-full resize-none rounded-lg bg-surface px-3 py-2.5 text-sm leading-6 text-ink"
        />
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => setSubmitted(true)}
            disabled={!idea.trim()}
            className="zouzou-primary-button inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-3.5 text-sm font-medium text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Wand2 className="size-4" />
            让 AI 帮我整理
          </button>
        </div>
      </div>

      <div className="zouzou-panel rounded-xl bg-surface-muted p-4">
        {submitted ? (
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-ink-secondary">
              <Sparkles className="size-3.5 text-accent" />
              AI 规划助手
            </div>
            <p className="mt-2 text-sm leading-6 text-ink">
              我先按“个人网站 V1”来规划，优先解决你“想法太多、先做哪个”的问题。
            </p>
            <p className="mt-3 text-sm font-semibold text-ink">
              个人网站 V1
            </p>
            <p className="mt-1 text-xs leading-5 text-ink-secondary">
              两周内上线一个能展示作品、说明能力的个人网站。
            </p>
            <div className="mt-4 space-y-2">
              {tasks.map((task, index) => (
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
            <p className="mt-4 rounded-lg bg-success/10 px-3 py-2 text-xs leading-5 text-success">
              今日第一步：用 15 分钟完成第 1 条任务。
            </p>
          </div>
        ) : (
          <div className="flex min-h-48 items-center justify-center text-sm text-ink-muted">
            AI 整理后的计划会出现在这里
          </div>
        )}
      </div>
    </div>
  );
}
