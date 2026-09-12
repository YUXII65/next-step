import Link from "next/link";
import { ShieldAlert } from "lucide-react";

/**
 * 游客态在应用内的常驻提示。
 * 游客账号是随机用户名 + 随机密码（从不展示），会话 30 天，
 * 不提醒的话用户会在毫无预警的情况下失去全部内容。
 */
export function GuestBanner() {
  return (
    <div
      data-tour="guest-banner"
      className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-warning/25 bg-warning/10 px-4 py-2 text-xs leading-5 text-ink-secondary lg:px-8"
    >
      <ShieldAlert className="size-3.5 shrink-0 text-warning" />
      <span className="min-w-0">
        游客模式：内容只保存在这台浏览器，
        <span className="font-medium text-ink">注册后才能长期保存</span>。
      </span>
      <Link
        href="/guest/register"
        className="zouzou-primary-button ml-auto inline-flex h-7 shrink-0 items-center rounded-md bg-accent px-2.5 text-xs font-medium text-white transition-colors hover:bg-accent-strong"
      >
        注册并保存
      </Link>
    </div>
  );
}
