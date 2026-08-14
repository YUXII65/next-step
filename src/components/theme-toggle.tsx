"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const THEME_STORAGE = "theme";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = localStorage.getItem(THEME_STORAGE);
      const prefersDark =
        !stored && window.matchMedia("(prefers-color-scheme: dark)").matches;
      setDark(stored === "dark" || prefersDark);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function setTheme(next: boolean) {
    setDark(next);
    localStorage.setItem(THEME_STORAGE, next ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(!dark)}
      aria-label={dark ? "切换到白天模式" : "切换到夜晚模式"}
      title={dark ? "切换到白天" : "切换到夜晚"}
      className="zouzou-icon-button flex size-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
    >
      {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </button>
  );
}
