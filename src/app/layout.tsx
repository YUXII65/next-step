import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { CommandPalette } from "@/components/command-palette";

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
