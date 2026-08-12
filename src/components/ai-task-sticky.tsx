"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw, StickyNote, X } from "lucide-react";
import { getTaskCoachAdvice } from "@/app/actions";
import { trackEvent } from "@/lib/track";
import { useClickOutside } from "@/lib/use-click-outside";
import type { TaskCoachAdvice } from "@/lib/ai";

const STICKY_TIP_KEY = "next_step_sticky_tip_dismissed";
let stickyTipClaimed = false;

const DEFAULT_MESSAGE =
  "这个任务我还没有头绪，请给我一个能直接开始的行动方案";

export function AiTaskSticky({
  taskId,
  title,
  notes,
  projectName,
  status,
}: {
  taskId: string;
  title: string;
  notes?: string | null;
  projectName?: string | null;
  status?: string;
}) {
  const { ref, open, setOpen } = useClickOutside<HTMLDivElement>();
  const tipRef = useRef<HTMLDivElement>(null);
  const [advice, setAdvice] = useState<TaskCoachAdvice | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTip, setShowTip] = useState(false);

  async function generate() {
    setLoading(true);
    const next = await getTaskCoachAdvice({
      taskId,
      title,
      notes,
      projectName,
      status,
      message: DEFAULT_MESSAGE,
    });
    setAdvice(next);
    setLoading(false);
    trackEvent("task_sticky_generate", { taskId });
  }

  useEffect(() => {
    if (stickyTipClaimed) return;

    let isNewUser = false;
    let dismissed = false;
    try {
      isNewUser = localStorage.getItem("next_step_new_user") === "1";
      dismissed = localStorage.getItem(STICKY_TIP_KEY) === "1";
    } catch {
      // Ignore storage errors and skip the tip.
    }

    if (isNewUser && !dismissed) {
      stickyTipClaimed = true;
      setShowTip(true);
    }
  }, []);

  useEffect(() => {
    if (!showTip) return;

    function onPointerDown(event: PointerEvent) {
      if (tipRef.current && !tipRef.current.contains(event.target as Node)) {
        dismissTip();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [showTip]);

  function toggle() {
    dismissTip();
    setOpen((value) => !value);
    if (!open && !advice && !loading) {
      void generate();
    }
  }

  function dismissTip() {
    setShowTip(false);
    try {
      localStorage.setItem(STICKY_TIP_KEY, "1");
    } catch {
      // Ignore storage errors.
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        aria-label="行动便利贴"
        title="行动便利贴"
        className="flex size-8 items-center justify-center rounded-md border border-warning/30 bg-warning/10 text-warning transition-colors hover:bg-warning/20"
      >
        <StickyNote className="size-3.5" />
      </button>

      {showTip ? (
        <div
          ref={tipRef}
          className="absolute right-0 top-10 z-40 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-surface p-3 shadow-lg"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold text-ink">点这里试试</p>
            <button
              type="button"
              onClick={dismissTip}
              aria-label="关闭提示"
              title="关闭提示"
              className="flex size-6 shrink-0 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
            >
              <X className="size-3.5" />
            </button>
          </div>
          <p className="mt-1 text-xs leading-5 text-ink-secondary">
            AI 会把卡住的任务拆成能直接开始的小步。
          </p>
        </div>
      ) : null}

      {open ? (
        <div className="absolute right-0 top-10 z-30 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-surface p-3 shadow-lg">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-ink-secondary">行动便利贴</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="关闭便利贴"
              title="关闭便利贴"
              className="flex size-6 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
            >
              <X className="size-3.5" />
            </button>
          </div>

          {loading ? (
            <p className="mt-4 text-sm leading-6 text-ink-secondary">
              AI 正在写便利贴...
            </p>
          ) : advice ? (
            <div className="mt-3 rounded-lg border border-[#eadf9a] bg-[#fff8d6] p-3">
              <p className="text-sm font-semibold text-ink">{advice.title}</p>
              <p className="mt-1 text-sm leading-6 text-ink-secondary">
                {advice.encouragement}
              </p>
              <ol className="mt-3 space-y-2">
                {advice.steps.map((step, index) => (
                  <li
                    key={`${step}-${index}`}
                    className="flex items-start gap-2 text-sm leading-6 text-ink"
                  >
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/70 text-xs font-medium text-ink-secondary">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
              <p className="mt-3 rounded-md bg-white/70 px-3 py-2 text-sm leading-6 text-ink">
                先做这个：{advice.nextStep}
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-ink-secondary">
              点击后会自动生成一张可执行的便利贴。
            </p>
          )}

          {advice ? (
            <button
              type="button"
              onClick={() => void generate()}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-ink-secondary transition-colors hover:text-accent"
            >
              <RefreshCw className="size-3.5" />
              换一张
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
