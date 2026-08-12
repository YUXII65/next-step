"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Sparkles } from "lucide-react";
import { addInboxItemAndClarify } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { markFirstAiQuestionAsked } from "@/lib/first-run-hints";
import { trackEvent } from "@/lib/track";
import { sampleIdeas } from "@/lib/sample-ideas";

function pickRandomSample() {
  const copy = [...sampleIdeas];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy.slice(0, 3);
}

function samplesForDate() {
  const start = (new Date().getDate() * 7) % sampleIdeas.length;
  return [
    sampleIdeas[start],
    sampleIdeas[(start + 1) % sampleIdeas.length],
    sampleIdeas[(start + 2) % sampleIdeas.length],
  ];
}

export function QuickCapture({ compact = false }: { compact?: boolean }) {
  const [content, setContent] = useState("");
  const [samples, setSamples] = useState(samplesForDate);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("deepseek-v4-flash");
  const [baseUrl, setBaseUrl] = useState("https://api.deepseek.com");

  useEffect(() => {
    function readStorage() {
      setApiKey(localStorage.getItem("ai-api-key") ?? "");
      setModel(localStorage.getItem("ai-model") ?? "deepseek-v4-flash");
      setBaseUrl(
        localStorage.getItem("ai-base-url") ?? "https://api.deepseek.com",
      );
    }

    function onKeyUpdated() {
      readStorage();
    }

    const timer = window.setTimeout(readStorage, 0);
    window.addEventListener("ai-key-updated", onKeyUpdated);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("ai-key-updated", onKeyUpdated);
    };
  }, []);

  function refreshSamples() {
    setSamples(pickRandomSample());
    trackEvent("home_sample_refresh");
  }

  return (
    <form
      action={addInboxItemAndClarify}
      className="p-4"
      onSubmit={() => {
        markFirstAiQuestionAsked();
        trackEvent("home_ai_input_submit");
      }}
    >
      <input type="hidden" name="apiKey" value={apiKey} />
      <input type="hidden" name="model" value={model} />
      <input type="hidden" name="baseUrl" value={baseUrl} />
      <label className="sr-only" htmlFor="quick-capture">
        快速记录
      </label>
      <textarea
        id="quick-capture"
        name="content"
        required
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={compact ? 3 : 4}
        placeholder="今天脑子里在转什么？直接倒出来"
        className="min-h-28 w-full resize-none rounded-lg border border-border bg-surface-muted px-3 py-2.5 text-sm leading-6 text-ink outline-none placeholder:text-ink-muted focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent/20"
      />
      <div className="mt-2 flex flex-wrap gap-2">
        {samples.map((sample) => (
          <button
            key={sample}
            type="button"
            onClick={() => setContent(sample)}
            className="max-w-full truncate rounded-md bg-surface px-2 py-1 text-xs font-medium text-ink-secondary transition-colors hover:bg-accent-soft hover:text-accent-strong"
          >
            {sample}
          </button>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-start">
        <button
          type="button"
          onClick={refreshSamples}
          aria-label="换一批示例想法"
          title="换一批示例想法"
          className="flex size-7 shrink-0 items-center justify-center rounded-md bg-surface text-ink-muted transition-colors hover:bg-accent-soft hover:text-accent-strong"
        >
          <RefreshCw className="size-3.5" />
        </button>
      </div>
      <div className="mt-3 flex justify-end">
        <SubmitButton
          pendingText="AI 梳理中..."
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-3.5 text-sm font-medium text-white transition-colors hover:bg-accent-strong"
        >
          <Sparkles className="size-4" />
          下一步：让 AI 梳理
        </SubmitButton>
      </div>
    </form>
  );
}
