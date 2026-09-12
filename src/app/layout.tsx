import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { CommandPalette } from "@/components/command-palette";
import { UsageTracker } from "@/components/usage-tracker";
import { getAdminUser } from "@/lib/admin";
import { ASSET_GUARD_CSS, ASSET_GUARD_SCRIPT } from "@/lib/asset-guard";

export const metadata: Metadata = {
  title: {
    default: "走走",
    template: "%s | 走走",
  },
  description: "把零散想法变成可持续推进的个人项目",
  icons: {
    icon: [
      { url: "/favicon.ico?v=2", type: "image/x-icon", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon.png", type: "image/png", sizes: "256x256" },
    ],
    apple: [{ url: "/icon.png", sizes: "256x256", type: "image/png" }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const admin = await getAdminUser();

  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-dvh text-ink">
        {/*
          静态资源守卫：EdgeOne 发布窗口内 /_next/static/* 可能 404，且这些 404 带
          immutable 缓存头，普通刷新救不回来。这段内联脚本会检测样式是否生效、
          用带缓存击穿参数的 URL 重试，并在失败期间启用一份极简兜底样式。
        */}
        <style dangerouslySetInnerHTML={{ __html: ASSET_GUARD_CSS }} />
        <script dangerouslySetInnerHTML={{ __html: ASSET_GUARD_SCRIPT }} />
        <Sidebar isAdmin={Boolean(admin)} />
        <CommandPalette isAdmin={Boolean(admin)} />
        <UsageTracker />
        <div className="lg:pl-[72px]">
          <main className="mx-auto w-full max-w-5xl px-4 py-5 pb-28 sm:px-6 lg:px-8 lg:py-8 lg:pb-12">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
