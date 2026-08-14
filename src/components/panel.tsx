import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cx } from "@/lib/utils";

export function Panel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cx(
        "zouzou-panel",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function PanelHeader({
  title,
  icon: Icon,
  action,
}: {
  title: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-3 border-b border-border/70 px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        {Icon ? <Icon className="size-4 shrink-0 text-ink-muted" /> : null}
        <h2 className="truncate text-[15px] font-semibold text-ink">{title}</h2>
      </div>
      {action}
    </div>
  );
}
