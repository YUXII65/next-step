"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, X } from "lucide-react";

const DONE_KEY = "next_step_first_task_done";
const SHOW_KEY = "next_step_show_review_hint";
let claimed = false;

export function FirstTaskReviewHint() {
  const [visible, setVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (claimed) return;

    try {
      const isNewUser = localStorage.getItem("next_step_new_user") === "1";
      const done = localStorage.getItem(DONE_KEY) === "1";
      const shouldShow = localStorage.getItem(SHOW_KEY) === "1";
      if (isNewUser && done && shouldShow) {
        claimed = true;
        setVisible(true);
      }
    } catch {
      // Ignore storage errors and skip the hint.
    }
  }, []);

  useEffect(() => {
    if (!visible) return;

    function onPointerDown(event: PointerEvent) {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        dismiss();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [visible]);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.removeItem(SHOW_KEY);
    } catch {
      // Ignore storage errors.
    }
  }

  if (!visible) return null;

  return (
    <div
      ref={cardRef}
      role="note"
      className="fixed bottom-24 left-4 right-4 z-50 w-auto max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-surface p-4 shadow-lg sm:bottom-auto sm:left-auto sm:right-4 sm:top-20 sm:w-80"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-ink">第一次完成</p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="关闭提示"
          title="关闭提示"
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
        >
          <X className="size-4" />
        </button>
      </div>
      <p className="mt-1 text-xs leading-5 text-ink-secondary">
        今天任务结束后，可以来抽屉页复盘。
      </p>
      <Link
        href="/review"
        onClick={dismiss}
        className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-md bg-accent px-3 text-xs font-medium text-white transition-colors hover:bg-accent-strong"
      >
        去复盘
        <ArrowRight className="size-3.5" />
      </Link>
    </div>
  );
}
