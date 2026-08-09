"use client";

const STORAGE_KEY = "next-step-events";

export function trackEvent(
  name: string,
  detail?: Record<string, unknown>,
) {
  if (typeof window === "undefined") return;

  try {
    const current = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "[]",
    ) as Array<Record<string, unknown>>;
    current.push({
      name,
      detail: detail ?? {},
      at: new Date().toISOString(),
    });
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(current.slice(-200)),
    );
  } catch {
    // Local usage tracking should never block the app.
  }
}
