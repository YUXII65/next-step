"use client";

import { useRef, useState, useTransition } from "react";
import type { ChangeEvent } from "react";
import { Loader2, PencilLine, Upload } from "lucide-react";
import { updateUserProfile } from "@/app/actions";
import { useClickOutside } from "@/lib/use-click-outside";
import { cx } from "@/lib/utils";

const AVATAR_PIXELS = 192;
const MAX_AVATAR_CHARS = 400_000;

export type ProfileUser = {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isGuest: boolean;
};

/** 把上传的图片压成 192×192 的 JPEG data URL，避免把大图塞进数据库 */
async function fileToAvatarDataUrl(file: File) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_PIXELS;
  canvas.height = AVATAR_PIXELS;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas unavailable");

  const scale = Math.max(
    AVATAR_PIXELS / bitmap.width,
    AVATAR_PIXELS / bitmap.height,
  );
  const width = bitmap.width * scale;
  const height = bitmap.height * scale;
  context.drawImage(
    bitmap,
    (AVATAR_PIXELS - width) / 2,
    (AVATAR_PIXELS - height) / 2,
    width,
    height,
  );
  bitmap.close?.();
  return canvas.toDataURL("image/jpeg", 0.85);
}

export function ProfileCard({
  user,
  placement = "rail",
}: {
  user: ProfileUser;
  placement?: "rail" | "header";
}) {
  const { ref, open, setOpen } = useClickOutside<HTMLDivElement>();
  const [name, setName] = useState(user.displayName ?? user.username);
  const [avatar, setAvatar] = useState(user.avatarUrl ?? "");
  const [avatarMenu, setAvatarMenu] = useState(false);
  const [error, setError] = useState("");
  const [saving, startSaving] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const displayName = user.displayName || user.username;

  function resetForm() {
    setName(user.displayName ?? user.username);
    setAvatar(user.avatarUrl ?? "");
    setAvatarMenu(false);
    setError("");
  }

  async function onPickFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError("");
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      if (dataUrl.length > MAX_AVATAR_CHARS) {
        setError("图片太大了，换一张小一点的。");
        return;
      }
      setAvatar(dataUrl);
      setAvatarMenu(false);
    } catch {
      setError("这张图片读不出来，换一张试试。");
    }
  }

  function save() {
    setError("");
    const formData = new FormData();
    formData.set("name", name.trim());
    formData.set("avatarUrl", avatar);
    startSaving(async () => {
      try {
        const result = await updateUserProfile(formData);
        if (result && !result.ok) {
          setError(result.error);
          return;
        }
        setOpen(false);
        setAvatarMenu(false);
      } catch {
        setError("保存失败，请重试。");
      }
    });
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          if (open) resetForm();
        }}
        aria-label="账号资料"
        title={displayName}
        className={cx(
          "zouzou-icon-button flex items-center gap-2 rounded-lg transition-colors hover:bg-surface-hover",
          placement === "rail"
            ? "size-10 justify-center"
            : "h-9 max-w-[8.5rem] px-1.5",
        )}
      >
        <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-soft text-xs font-semibold text-accent-strong">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className="size-full object-cover" />
          ) : (
            displayName.slice(0, 1).toUpperCase()
          )}
        </span>
        {placement === "header" ? (
          <span className="truncate text-xs font-medium text-ink-secondary">
            {displayName}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className={cx(
            "zouzou-panel absolute z-40 w-64 rounded-xl p-3 shadow-pop animate-[zouzou-fade-in_240ms_ease-out]",
            placement === "rail" ? "bottom-0 left-12" : "right-0 top-11",
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold text-ink">账号资料</p>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
              className="flex size-6 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
              aria-label="关闭"
              title="关闭"
            >
              ✕
            </button>
          </div>

          {/* 头像：默认只有一个入口，点开后才是「上传图片 / 恢复默认」 */}
          <div className="mt-3 flex items-center gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent-soft text-sm font-semibold text-accent-strong">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt="" className="size-full object-cover" />
              ) : (
                (name.trim() || user.username).slice(0, 1).toUpperCase()
              )}
            </span>
            {avatarMenu ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="zouzou-secondary-button inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-xs font-medium text-ink-secondary transition-colors hover:border-accent hover:text-accent"
                >
                  <Upload className="size-3.5" />
                  上传图片
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAvatar("");
                    setAvatarMenu(false);
                  }}
                  className="inline-flex h-7 items-center rounded-md border border-border bg-surface px-2.5 text-xs font-medium text-ink-secondary transition-colors hover:border-danger hover:text-danger"
                >
                  恢复默认
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAvatarMenu(true)}
                className="zouzou-secondary-button inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 text-xs font-medium text-ink-secondary transition-colors hover:border-accent hover:text-accent"
              >
                <PencilLine className="size-3.5" />
                修改头像
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPickFile}
          />

          <label className="mt-3 block">
            <span className="mb-1.5 block text-xs font-medium text-ink-secondary">
              {user.isGuest ? "显示昵称" : "昵称（也是登录名）"}
            </span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={24}
              placeholder={user.username}
              className="zouzou-input w-full rounded-lg px-3 py-2 text-sm text-ink"
            />
          </label>

          <p className="mt-2 text-xs leading-5 text-ink-muted">
            {user.isGuest
              ? "游客账号名在注册时设置，这里改的是显示昵称。"
              : "改完请用新名字登录，旧名字将无法登录。"}
          </p>

          {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}

          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setOpen(false);
              }}
              className="zouzou-secondary-button inline-flex h-8 items-center rounded-lg border border-border bg-surface px-3 text-xs font-medium text-ink-secondary transition-colors hover:bg-surface-hover"
            >
              取消
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="zouzou-primary-button inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-medium text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <PencilLine className="size-3.5" />
              )}
              保存
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}