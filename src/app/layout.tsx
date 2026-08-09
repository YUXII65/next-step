import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { CommandPalette } from "@/components/command-palette";

export const metadata: Metadata = {
  title: {
    default: "下一步",
    template: "%s | 下一步",
  },
  description: "把零散想法变成可持续推进的个人项目",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon.png", type: "image/png", sizes: "256x256" },
      { url: "/favicon.ico", sizes: "any" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-dvh bg-background text-ink">
        <Sidebar />
        <CommandPalette />
        <div className="lg:pl-16">
          <main className="mx-auto w-full max-w-5xl px-4 py-5 pb-28 sm:px-6 lg:px-8 lg:py-7 lg:pb-12">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
