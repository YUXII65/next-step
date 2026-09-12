const PENDING_IDEA_KEY = "next_step_pending_idea";

/** 演示页/落地页里写的那句话，带到正式引导，避免用户重写一遍 */
export function savePendingIdea(idea: string) {
  if (typeof window === "undefined") return;
  const value = idea.trim();
  if (!value) return;
  try {
    localStorage.setItem(PENDING_IDEA_KEY, value);
  } catch {
    // Ignore storage errors.
  }
}

export function takePendingIdea() {
  if (typeof window === "undefined") return "";
  try {
    const value = localStorage.getItem(PENDING_IDEA_KEY) ?? "";
    if (value) localStorage.removeItem(PENDING_IDEA_KEY);
    return value;
  } catch {
    return "";
  }
}