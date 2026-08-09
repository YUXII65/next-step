"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, KeyRound, Sparkles } from "lucide-react";

const KEY_STORAGE = "ai-api-key";
const MODEL_STORAGE = "ai-model";
const BASE_URL_STORAGE = "ai-base-url";

export function AiSettings() {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("deepseek-chat");
  const [baseUrl, setBaseUrl] = useState("https://api.deepseek.com");
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    function readStorage() {
      setApiKey(localStorage.getItem(KEY_STORAGE) ?? "");
      setModel(localStorage.getItem(MODEL_STORAGE) ?? "deepseek-chat");
      setBaseUrl(
        localStorage.getItem(BASE_URL_STORAGE) ?? "https://api.deepseek.com",
      );
      setConnected(Boolean(localStorage.getItem(KEY_STORAGE)));
    }

    function onKeyUpdated() {
      setConnected(Boolean(localStorage.getItem(KEY_STORAGE)));
    }

    const timer = window.setTimeout(readStorage, 0);
    window.addEventListener("ai-key-updated", onKeyUpdated);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("ai-key-updated", onKeyUpdated);
    };
  }, []);

  function save() {
    const key = apiKey.trim();
    if (key) {
      localStorage.setItem(KEY_STORAGE, key);
      localStorage.setItem(MODEL_STORAGE, model.trim() || "deepseek-chat");
      localStorage.setItem(
        BASE_URL_STORAGE,
        baseUrl.trim() || "https://api.deepseek.com",
      );
    } else {
      localStorage.removeItem(KEY_STORAGE);
      localStorage.removeItem(MODEL_STORAGE);
      localStorage.removeItem(BASE_URL_STORAGE);
    }
    setConnected(Boolean(key));
    window.dispatchEvent(new Event("ai-key-updated"));
  }

  return (
    <details className="rounded-md border border-border bg-surface">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-xs font-medium text-ink-secondary transition-colors hover:text-accent">
        <span className="flex items-center gap-1.5">
          <KeyRound className="size-3.5" />
          AI 连接
        </span>
        <span
          className={
            connected
              ? "inline-flex items-center gap-1 text-success"
              : "inline-flex items-center gap-1 text-warning"
          }
        >
          {connected ? (
            <>
              <CheckCircle2 className="size-3.5" />
              已连接
            </>
          ) : (
            <>
              <Sparkles className="size-3.5" />
              本地规则
            </>
          )}
        </span>
      </summary>
      <div className="space-y-3 border-t border-border p-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink-secondary">
            DeepSeek API Key
          </span>
          <input
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="sk-..."
            className="w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink-secondary">
            模型
          </span>
          <input
            value={model}
            onChange={(event) => setModel(event.target.value)}
            placeholder="deepseek-chat"
            className="w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-ink-secondary">
            API 地址
          </span>
          <input
            value={baseUrl}
            onChange={(event) => setBaseUrl(event.target.value)}
            placeholder="https://api.deepseek.com"
            className="w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent/20"
          />
        </label>
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] leading-4 text-ink-muted">
            Key 只保存在本机浏览器，用于当前 AI 请求。
          </p>
          <button
            type="button"
            onClick={save}
            className="inline-flex h-8 shrink-0 items-center justify-center rounded-md bg-accent px-3 text-xs font-medium text-white transition-colors hover:bg-accent-strong"
          >
            保存
          </button>
        </div>
      </div>
    </details>
  );
}
