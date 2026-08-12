"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { recordPageView } from "@/app/actions";

export function UsageTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;

    const timer = window.setTimeout(() => {
      void recordPageView(pathname);
    }, 600);

    return () => window.clearTimeout(timer);
  }, [pathname]);

  return null;
}
