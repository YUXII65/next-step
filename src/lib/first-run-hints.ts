const DONE_KEY = "next_step_first_task_done";
const SHOW_KEY = "next_step_show_review_hint";

export function markFirstTaskDone() {
  if (typeof window === "undefined") return;

  try {
    if (localStorage.getItem("next_step_new_user") !== "1") return;
    if (localStorage.getItem(DONE_KEY) === "1") return;
    localStorage.setItem(DONE_KEY, "1");
    localStorage.setItem(SHOW_KEY, "1");
  } catch {
    // Ignore storage errors and continue without the hint.
  }
}
