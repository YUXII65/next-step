"use client";

import { useEffect, useRef, useState } from "react";
import { Check, CornerDownLeft, MessageSquareText, Send, Sparkles } from "lucide-react";
import type { InboxClarificationDimension } from "@/lib/ai";

type Props = {
  dimensions: InboxClarificationDimension[];
  supplementPlaceholder: string;
  busy?: boolean;
  submitLabel?: string;
  onSubmit: (payload: { answers: string[][]; supplement: string }) => void;
};

type Turn = {
  role: "ai" | "user";
  text: string;
  options?: string[];
  multi?: boolean;
};

const TYPING_MS = 600;

export function ChatClarify({
  dimensions,
  busy = false,
  submitLabel = "给我下一步",
  onSubmit,
}: Props) {
  const [turns, setTurns] = useState<Turn[]>(() =>
    dimensions.length
      ? [
          {
            role: "ai",
            text: dimensions[0].question,
            options: dimensions[0].options,
            multi: dimensions[0].multi,
          },
        ]
      : [],
  );
  const [answers, setAnswers] = useState<string[][]>([]);
  const [pending, setPending] = useState<string[]>([]);
  const [thinking, setThinking] = useState(false);
  const [done, setDone] = useState(dimensions.length === 0);
  const [typed, setTyped] = useState("");
  const [directInput, setDirectInput] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const answeredCount = answers.length;
  const lastTurn = turns[turns.length - 1];
  const isMulti = Boolean(lastTurn?.role === "ai" && lastTurn.multi);
  const showOptions = Boolean(
    lastTurn?.role === "ai" && lastTurn.options?.length && !done,
  );
  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [turns, thinking, done, busy]);

  function toggle(option: string) {
    if (busy || thinking) return;
    setPending((current) =>
      current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option],
    );
  }

  function commit(answer: string[]) {
    if (busy || thinking || !answer.length) return;
    const nextAnswered = answeredCount + 1;
    const isLast = nextAnswered >= dimensions.length;
    const all = [...answers, answer];
    const main = all[0]?.join("、") ?? "";
    const rest = all.slice(1).flat().join("、");
    setTurns((current) => [
      ...current,
      { role: "user", text: answer.join("、") },
    ]);
    setAnswers((current) => [...current, answer]);
    setPending([]);
    setTyped("");
    setDirectInput(false);
    setThinking(true);
    window.setTimeout(() => {
      setThinking(false);
      if (!isLast) {
        const next = dimensions[nextAnswered];
        setTurns((current) => [
          ...current,
          {
            role: "ai",
            text: next.question,
            options: next.options,
            multi: next.multi,
          },
        ]);
      } else {
        setDone(true);
        setTurns((current) => [
          ...current,
          {
            role: "ai",
            text: main
              ? `好，我会优先按「${main}」来安排。${
                  rest ? `也记住了：${rest}。` : ""
                }这就帮你拆成今天能做的下一步。`
              : "好，这就帮你拆成下一步。",
          },
        ]);
      }
    }, TYPING_MS);
  }

  function submitDirect() {
    if (!typed.trim() || busy || thinking) return;
    commit([typed.trim()]);
  }

  function submitAll() {
    if (busy) return;
    onSubmit({ answers, supplement: "" });
  }

  return (
    <div className="zouzou-panel overflow-hidden rounded-xl">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <span className="flex size-7 items-center justify-center rounded-md bg-accent-soft text-accent-strong">
          <MessageSquareText className="size-3.5" />
        </span>
        <p className="text-xs font-medium text-ink-secondary">走走 · 推进伙伴</p>
      </div>

      <div
        ref={scrollRef}
        className="max-h-[420px] space-y-3 overflow-y-auto px-4 py-4"
      >
        {turns.map((turn, index) =>
          turn.role === "user" ? (
            <div
              key={index}
              className="ml-auto flex max-w-[82%] justify-end"
            >
              <div className="rounded-xl rounded-tr-sm bg-accent px-3 py-2 text-sm font-medium leading-6 text-white">
                {turn.text}
              </div>
            </div>
          ) : (
            <div key={index} className="flex justify-start">
              <div className="flex max-w-full items-start gap-2">
                <span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent-strong">
                  <Sparkles className="size-3.5" />
                </span>
                <div className="min-w-0 max-w-full">
                  <div className="rounded-xl rounded-tl-sm border border-border/70 bg-surface px-3 py-2.5 text-sm leading-6 text-ink">
                    {turn.text}
                  </div>
                  {showOptions && index === turns.length - 1 ? (
                    <div className="mt-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {turn.options?.map((option) => {
                          const selected = pending.includes(option);
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() =>
                                isMulti ? toggle(option) : commit([option])
                              }
                              disabled={busy || thinking}
                              className={
                                selected
                                  ? "inline-flex items-center gap-1.5 rounded-lg border-2 border-accent bg-accent-soft px-3 py-2 text-sm font-medium text-accent-strong transition-colors"
                                  : "inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm font-medium text-ink-secondary transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
                              }
                            >
                              {selected ? <Check className="size-3.5" /> : null}
                              {option}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => setDirectInput(true)}
                          disabled={busy || thinking}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border bg-transparent px-3 py-2 text-sm text-ink-muted transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <CornerDownLeft className="size-3.5" />
                          想自己说
                        </button>
                      </div>
                      {isMulti ? (
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <p className="text-[11px] text-ink-muted">可多选</p>
                          <button
                            type="button"
                            onClick={() => commit(pending)}
                            disabled={!pending.length || busy || thinking}
                            className="zouzou-primary-button inline-flex h-8 items-center gap-1 rounded-lg bg-accent px-3 text-xs font-medium text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Check className="size-3.5" />
                            确定
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ),
        )}

        {thinking ? (
          <div className="flex items-start gap-2">
            <span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent-strong">
              <Sparkles className="size-3.5" />
            </span>
            <div className="flex items-center gap-1 rounded-xl rounded-tl-sm border border-border/70 bg-surface px-3 py-2.5">
              <span className="size-1.5 animate-[zouzou-soft-pulse_1s_ease-in-out_infinite] rounded-full bg-ink-muted" />
              <span className="size-1.5 animate-[zouzou-soft-pulse_1s_ease-in-out_infinite] rounded-full bg-ink-muted [animation-delay:150ms]" />
              <span className="size-1.5 animate-[zouzou-soft-pulse_1s_ease-in-out_infinite] rounded-full bg-ink-muted [animation-delay:300ms]" />
            </div>
          </div>
        ) : null}

        {directInput && showOptions ? (
          <div className="flex justify-start pl-8">
            <form
              className="flex w-full max-w-[82%] items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                submitDirect();
              }}
            >
              <input
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
                placeholder="输入你想说的话"
                className="zouzou-input min-w-0 flex-1 rounded-lg px-3 py-2 text-sm text-ink"
                autoFocus
              />
              <button
                type="submit"
                disabled={!typed.trim() || busy || thinking}
                className="zouzou-primary-button inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="发送"
              >
                <Send className="size-4" />
              </button>
            </form>
          </div>
        ) : null}

        {done ? (
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={submitAll}
              disabled={busy}
              className={`zouzou-primary-button inline-flex h-11 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-medium text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50 ${
                busy
                  ? ""
                  : "animate-[zouzou-attention_1.8s_ease-in-out_infinite]"
              }`}
            >
              {busy ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="flex gap-1">
                    <span className="size-1 animate-[zouzou-soft-pulse_1s_ease-in-out_infinite] rounded-full bg-white" />
                    <span className="size-1 animate-[zouzou-soft-pulse_1s_ease-in-out_infinite] rounded-full bg-white [animation-delay:160ms]" />
                    <span className="size-1 animate-[zouzou-soft-pulse_1s_ease-in-out_infinite] rounded-full bg-white [animation-delay:320ms]" />
                  </span>
                  正在整理
                </span>
              ) : (
                submitLabel
              )}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
