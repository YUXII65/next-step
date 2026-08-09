"use client";

import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { recordSuggestionFeedback } from "@/app/actions";

export function ReviewDraftFeedback({ reviewId }: { reviewId: string }) {
  const [feedback, setFeedback] = useState<"useful" | "useless" | null>(null);

  function send(action: "useful" | "useless") {
    if (feedback) return;
    setFeedback(action);
    void recordSuggestionFeedback({
      source: "review_draft",
      action,
      detail: reviewId,
    });
  }

  return (
    <div className="flex items-center gap-1 border-b border-border px-4 py-2">
      <button
        type="button"
        onClick={() => send("useful")}
        aria-label="复盘草稿有用"
        title="复盘草稿有用"
        className={
          feedback === "useful"
            ? "flex size-7 items-center justify-center rounded-md bg-accent-soft text-accent-strong"
            : "flex size-7 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface hover:text-accent"
        }
      >
        <ThumbsUp className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={() => send("useless")}
        aria-label="复盘草稿没用"
        title="复盘草稿没用"
        className={
          feedback === "useless"
            ? "flex size-7 items-center justify-center rounded-md bg-danger/10 text-danger"
            : "flex size-7 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface hover:text-danger"
        }
      >
        <ThumbsDown className="size-3.5" />
      </button>
    </div>
  );
}
