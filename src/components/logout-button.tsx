"use client";

import { useRef, useState } from "react";
import { LogOut } from "lucide-react";
import { logoutUser } from "@/app/actions";

export function LogoutButton({ className }: { className?: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <form ref={formRef} action={logoutUser}>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          aria-label="退出登录"
          title="退出登录"
          aria-haspopup="dialog"
          className={className}
        >
          <LogOut className="size-[18px]" />
        </button>
      </form>

      {confirming ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-overlay px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-confirm-title"
        >
          <div className="zouzou-panel w-full max-w-sm rounded-xl p-6 shadow-pop">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-ink-secondary">
                <LogOut className="size-4" />
              </span>
              <div>
                <h2
                  id="logout-confirm-title"
                  className="text-sm font-semibold text-ink"
                >
                  退出登录？
                </h2>
                <p className="mt-2 text-sm leading-6 text-ink-secondary">
                  退出不会删除你的项目、任务和复盘，下次登录后还会在。
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="zouzou-secondary-button inline-flex h-10 items-center rounded-lg border border-border bg-surface px-4 text-sm font-medium text-ink-secondary transition-colors hover:bg-surface-hover"
              >
                再想想
              </button>
              <button
                type="button"
                onClick={() => formRef.current?.requestSubmit()}
                className="zouzou-primary-button inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-strong"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
