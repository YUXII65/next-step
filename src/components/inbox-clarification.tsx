"use client";

import { useEffect, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { generateInboxPlan } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import type { InboxClarificationDimension } from "@/lib/ai";

const inputClass =
  "w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm leading-6 text-ink outline-none placeholder:text-ink-muted focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent/20";

export function InboxClarification({
  itemId,
  content,
  dimensions,
  supplementPlaceholder,
}: {
  itemId: string;
  content: string;
  dimensions: InboxClarificationDimension[];
  supplementPlaceholder: string;
}) {
  const [selections, setSelections] = useState<string[]>(
    () => dimensions.map(() => ""),
  );
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("deepseek-v4-flash");
  const [baseUrl, setBaseUrl] = useState("https://api.deepseek.com");
  const [supplement, setSupplement] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setApiKey(localStorage.getItem("ai-api-key") ?? "");
      setModel(localStorage.getItem("ai-model") ?? "deepseek-v4-flash");
      setBaseUrl(
        localStorage.getItem("ai-base-url") ?? "https://api.deepseek.com",
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const allSelected =
    dimensions.length > 0 &&
    dimensions.every((_, index) => Boolean(selections[index]));
  const canGenerate = allSelected || Boolean(supplement.trim());

  return (
    <div>
      <p className="text-sm leading-6 text-ink">{content}</p>

      <div className="mt-3 rounded-lg bg-surface p-3">
        <div className="flex items-center gap-2 text-xs font-medium text-ink-secondary">
          <Sparkles className="size-3.5 text-accent" />
          AI 规划助手
        </div>
        <p className="mt-2 text-sm leading-6 text-ink">
          我先把你的想法拆成几个维度，每个维度选一个最接近的方向。
        </p>
      </div>

      <div className="mt-3 space-y-3">
        {dimensions.map((dimension, dimensionIndex) => (
          <div
            key={`${dimension.key}-${dimensionIndex}`}
            className="rounded-lg border border-border bg-surface p-3"
          >
            <p className="mt-1 text-sm font-medium text-ink">
              {dimension.question}
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {dimension.options.map((option) => {
                const active = selections[dimensionIndex] === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      setSelections((current) =>
                        current.map((value, index) =>
                          index === dimensionIndex ? option : value,
                        ),
                      )
                    }
                    className={
                      active
                        ? "flex items-center justify-between gap-2 rounded-lg border-2 border-accent bg-accent-soft px-3 py-2.5 text-left text-sm font-medium text-accent-strong transition-colors"
                        : "flex items-center justify-between gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2.5 text-left text-sm font-medium text-ink-secondary transition-colors hover:border-accent hover:text-accent"
                    }
                  >
                    <span>{option}</span>
                    {active ? <Check className="size-4 shrink-0" /> : null}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <form action={generateInboxPlan} className="mt-3 space-y-3">
        <input type="hidden" name="id" value={itemId} />
        <input type="hidden" name="option" value={selections[0] ?? ""} />
        <input type="hidden" name="supplement" value={supplement} />
        {dimensions.map((_, index) => (
          <input
            key={`choice-${index}`}
            type="hidden"
            name={`choice_${index}`}
            value={selections[index] ?? ""}
          />
        ))}
        <input type="hidden" name="apiKey" value={apiKey} />
        <input type="hidden" name="model" value={model} />
        <input type="hidden" name="baseUrl" value={baseUrl} />
        <textarea
          value={supplement}
          onChange={(event) => setSupplement(event.target.value)}
          rows={2}
          placeholder={supplementPlaceholder}
          className={inputClass}
        />
        <div className="flex justify-end">
          <SubmitButton
            disabled={!canGenerate}
            pendingText="生成计划中..."
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-3.5 text-sm font-medium text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className="size-4" />
            下一步：生成计划
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
