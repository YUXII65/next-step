import {
  Flame,
  Inbox,
  ListTodo,
  NotebookPen,
  Target,
} from "lucide-react";
import { cx } from "@/lib/utils";

const stages = [
  { label: "收想法", icon: Inbox },
  { label: "定目标", icon: Target },
  { label: "今日行动", icon: ListTodo },
  { label: "每晚复盘", icon: NotebookPen },
];

export function LoopProgress({
  stage,
  streak,
  weekDone,
  reviewedToday,
}: {
  stage: number;
  streak: number;
  weekDone: number;
  reviewedToday: boolean;
}) {
  return (
    <div className="zouzou-panel flex flex-col justify-center gap-3 rounded-xl px-4 py-3 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-ink-secondary">你的推进闭环</p>
        <div className="flex items-center gap-3 text-xs text-ink-secondary">
          <span className="inline-flex items-center gap-1">
            <Flame className="size-3.5 text-warning" />
            连续 {streak} 天
          </span>
          <span
            className={
              weekDone > 0
                ? "inline-flex items-center gap-1 text-success"
                : "inline-flex items-center gap-1"
            }
          >
            <ListTodo className="size-3.5" />
            近 7 天完成 {weekDone} 件
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {stages.map((item, index) => {
          const Icon = item.icon;
          const done = index < stage || (index === 3 && reviewedToday);
          const current = index === stage;
          return (
            <div
              key={item.label}
              className={cx(
                "flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-center",
                current
                  ? "bg-accent-soft text-accent-strong"
                  : done
                    ? "bg-surface-muted text-ink"
                    : "bg-surface-muted text-ink-muted",
              )}
            >
              <span
                className={cx(
                  "flex size-7 items-center justify-center rounded-md",
                  current
                    ? "bg-accent text-white"
                    : done
                      ? "bg-accent-soft text-accent"
                      : "bg-surface text-ink-muted",
                )}
              >
                <Icon className="size-3.5" />
              </span>
              <span className="text-[11px] font-medium leading-4">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
