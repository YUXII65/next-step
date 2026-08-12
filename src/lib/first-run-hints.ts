const DONE_KEY = "next_step_first_task_done";
const SHOW_KEY = "next_step_show_review_hint";

const AI_QUESTION_KEY = "next_step_ai_question_asked";

export function markFirstAiQuestionAsked() {
  if (typeof window === "undefined") return;

  try {
    if (localStorage.getItem("next_step_new_user") === "1") {
      localStorage.setItem(AI_QUESTION_KEY, "1");
    }
  } catch {
    // Ignore storage errors and continue without the hint.
  }
}

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
