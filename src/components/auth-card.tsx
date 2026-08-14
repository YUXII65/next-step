"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { loginUser, registerUser } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";

const firstInputClass =
  "zouzou-input mt-4 w-full rounded-lg px-3 py-2 text-sm text-ink";
const inputClass =
  "zouzou-input mt-3 w-full rounded-lg px-3 py-2 text-sm text-ink";
const submitClass =
  "zouzou-primary-button mt-5 inline-flex h-10 w-full items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-strong";
const switchClass =
  "zouzou-secondary-button mt-2 inline-flex h-10 w-full items-center justify-center rounded-lg border border-border bg-surface px-4 text-sm font-medium text-accent transition-colors hover:bg-surface-hover";

export function AuthCard({
  next,
  error,
  initialMode,
}: {
  next: string;
  error: string;
  initialMode?: "login" | "register";
}) {
  const [mode, setMode] = useState<"login" | "register">(
    initialMode ?? (error === "register" ? "register" : "login"),
  );
  const [confirming, setConfirming] = useState(false);
  const [pendingUsername, setPendingUsername] = useState("");
  const registerFormRef = useRef<HTMLFormElement>(null);
  const allowSubmitRef = useRef(false);

  function handleRegisterSubmit(event: FormEvent<HTMLFormElement>) {
    if (allowSubmitRef.current) {
      allowSubmitRef.current = false;
      return;
    }

    event.preventDefault();
    const username = String(
      new FormData(event.currentTarget).get("username") ?? "",
    ).trim();
    setPendingUsername(username);
    setConfirming(true);
  }

  function confirmRegistration() {
    setConfirming(false);
    allowSubmitRef.current = true;
    registerFormRef.current?.requestSubmit();
  }

  return (
    <>
      {mode === "login" ? (
        <form
          action={loginUser}
          className="zouzou-panel rounded-xl p-6 sm:p-7"
        >
          <input type="hidden" name="next" value={next} />
          <h2 className="text-sm font-semibold text-ink">登录</h2>
          <input
            name="username"
            required
            minLength={2}
            maxLength={20}
            autoComplete="username"
            placeholder="用户名"
            className={firstInputClass}
          />
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="密码"
            className={inputClass}
          />
          {error === "login" ? (
            <p className="mt-3 text-sm text-danger">用户名或密码不对。</p>
          ) : null}
          <SubmitButton className={submitClass}>登录</SubmitButton>
          <div className="mt-5 border-t border-border pt-4">
            <p className="text-center text-sm text-ink-secondary">
              还没有账号？
            </p>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={switchClass}
            >
              注册账号
            </button>
          </div>
        </form>
      ) : (
        <form
          ref={registerFormRef}
          action={registerUser}
          onSubmit={handleRegisterSubmit}
          className="zouzou-panel rounded-xl p-6 sm:p-7"
        >
          <input type="hidden" name="next" value={next} />
          <h2 className="text-sm font-semibold text-ink">注册</h2>
          <input
            name="username"
            required
            minLength={2}
            maxLength={20}
            autoComplete="username"
            placeholder="用户名"
            className={firstInputClass}
          />
          <input
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="密码（至少 6 位）"
            className={inputClass}
          />
          {error === "register" ? (
            <p className="mt-3 text-sm text-danger">
              注册失败，请检查用户名和密码，或账号可能已存在。
            </p>
          ) : null}
          <SubmitButton className={submitClass}>注册</SubmitButton>
          <div className="mt-5 border-t border-border pt-4">
            <p className="text-center text-sm text-ink-secondary">
              已有账号？
            </p>
            <button
              type="button"
              onClick={() => setMode("login")}
              className={switchClass}
            >
              返回登录
            </button>
          </div>
        </form>
      )}

      {confirming ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-overlay px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="register-confirm-title"
        >
          <div className="zouzou-panel w-full max-w-sm rounded-xl p-6 shadow-pop">
            <h2
              id="register-confirm-title"
              className="text-sm font-semibold text-ink"
            >
              确认注册
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-secondary">
              账号“{pendingUsername}”将立即创建，确认后无需再次输入密码。
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="zouzou-secondary-button inline-flex h-10 items-center rounded-lg border border-border bg-surface px-4 text-sm font-medium text-ink-secondary transition-colors hover:bg-surface-hover"
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmRegistration}
                className="zouzou-primary-button inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-strong"
              >
                确认注册
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
