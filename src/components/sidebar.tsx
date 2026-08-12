"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive,
  Blocks,
  BookOpen,
  CalendarDays,
  LogOut,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { cx } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { logoutUser } from "@/app/actions";

const navItems = [
  { href: "/", label: "日历", icon: CalendarDays },
  { href: "/workspace", label: "书桌", icon: BookOpen },
  { href: "/review", label: "抽屉", icon: Archive },
];

export function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-border bg-surface px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <BrandMark className="size-7 rounded-md" />
          <span className="text-sm font-semibold">走走</span>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href="/tools"
            aria-label="工具匣"
            title="工具匣"
            className="flex size-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
          >
            <Blocks className="size-4" />
          </Link>
          <ThemeToggle />
          <form action={logoutUser}>
            <button
              type="submit"
              aria-label="退出登录"
              title="退出登录"
              className="flex size-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </header>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-16 flex-col items-center border-r border-border bg-surface py-4 lg:flex">
        <Link
          href="/"
          aria-label="走走"
          className="flex size-9 items-center justify-center rounded-lg"
        >
          <BrandMark className="size-9 rounded-lg" />
        </Link>

        <nav className="mt-5 flex flex-1 flex-col items-center gap-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                aria-label={item.label}
                title={item.label}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex size-9 items-center justify-center rounded-lg transition-colors",
                  active
                    ? "bg-accent-soft text-accent-strong"
                    : "text-ink-muted hover:bg-surface-hover hover:text-ink",
                )}
              >
                <Icon className="size-4" />
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col items-center gap-1">
          <Link
            href="/tools"
            aria-label="工具匣"
            title="工具匣"
            className="flex size-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
          >
            <Blocks className="size-4" />
          </Link>
          <ThemeToggle />
          <form action={logoutUser}>
            <button
              type="submit"
              aria-label="退出登录"
              title="退出登录"
              className="flex size-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
            >
              <LogOut className="size-4" />
            </button>
          </form>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-border bg-surface lg:hidden">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              aria-current={active ? "page" : undefined}
              className={cx(
                "flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium",
                active ? "text-accent" : "text-ink-muted",
              )}
            >
              <Icon className="size-4" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
