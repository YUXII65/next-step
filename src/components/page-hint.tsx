"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";

const HINTS_KEY = "next_step_hints";

export function PageHint({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isNewUser = false;
    let dismissed = false;

    try {
      isNewUser = localStorage.getItem("next_step_new_user") === "1";
      const stored = JSON.parse(
        localStorage.getItem(HINTS_KEY) ?? "{}",
      ) as Record<string, boolean>;
      dismissed = stored[id] === true;
    } catch {
      // localStorage can be unavailable in private or restricted contexts.
    }

    if (isNewUser && !dismissed) {
      setVisible(true);
    }
  }, [id]);

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
      const stored = JSON.parse(
        localStorage.getItem(HINTS_KEY) ?? "{}",
      ) as Record<string, boolean>;
      stored[id] = true;
      localStorage.setItem(HINTS_KEY, JSON.stringify(stored));
    } catch {
      // Ignore storage errors; the hint can still close for this session.
    }
  }

  if (!visible) return null;

  return (
    <div
      ref={cardRef}
      role="note"
      className="fixed bottom-24 left-4 right-4 z-40 w-auto max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-surface p-4 shadow-lg sm:bottom-auto sm:left-auto sm:right-4 sm:top-20 sm:w-72"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="关闭提示"
          title="关闭提示"
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface hover:text-ink"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="mt-1.5 text-xs leading-5 text-ink-secondary">
        {children}
      </div>
    </div>
  );
}
