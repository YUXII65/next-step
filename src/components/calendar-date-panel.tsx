import { CurrentTime } from "@/components/current-time";

export function CalendarDatePanel({
  now,
  completedToday,
  totalToday,
}: {
  now: Date;
  completedToday: number;
  totalToday: number;
}) {
  const progress = totalToday
    ? Math.round((completedToday / totalToday) * 100)
    : 0;
  const remaining = Math.max(totalToday - completedToday, 0);
  const weekday = [
    "星期日",
    "星期一",
    "星期二",
    "星期三",
    "星期四",
    "星期五",
    "星期六",
  ][now.getDay()];
  const initialTime = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes(),
  ).padStart(2, "0")}`;

  return (
    <section className="mb-5 rounded-lg border border-border bg-surface px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-semibold leading-none text-ink">
            {String(now.getDate()).padStart(2, "0")}
          </span>
          <span className="text-sm font-medium text-ink-secondary">
            {now.getMonth() + 1}月 {weekday}
          </span>
        </div>

        <div className="min-w-0 flex-1 text-sm text-ink-secondary sm:flex-none">
          <CurrentTime initial={initialTime} />
        </div>

        <div className="w-32">
          <div className="flex items-center justify-between text-xs text-ink-secondary">
            <span>今日</span>
            <span>
              {completedToday} / {totalToday}
              {remaining ? `，还剩 ${remaining}` : "，全部完成"}
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-accent transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
