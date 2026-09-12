export const TOUR_STORAGE_KEY = "next_step_tour";
export const TOUR_EVENT = "next-step:tour";

/** 引导要指向的元素，统一用 data-tour 标记，避免各处写错选择器 */
export const TOUR_TARGETS = {
  nextButton: '[data-tour="task-next"]',
  taskTools: '[data-tour="task-tools"]',
  bottomNav: '[data-tour="bottom-nav"], [data-tour="side-nav"]',
  guestBanner: '[data-tour="guest-banner"]',
} as const;

export type TourStep = "1" | "2" | "3" | "done";

export function normalizeTourStep(value: unknown): TourStep {
  if (value === "2" || value === "3" || value === "done") return value;
  return "1";
}

export function tourOrder(step: TourStep) {
  if (step === "done") return 99;
  return Number(step);
}