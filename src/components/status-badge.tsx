import { cx } from "@/lib/utils";

const styles: Record<string, string> = {
  active: "bg-success/10 text-success ring-success/20",
  paused: "bg-warning/10 text-warning ring-warning/20",
  completed: "bg-success/10 text-success ring-success/20",
  archived: "bg-surface-muted text-ink-muted ring-border",
  todo: "bg-surface-muted text-ink-secondary ring-border",
  in_progress: "bg-accent-soft text-accent-strong ring-accent/20",
  done: "bg-success/10 text-success ring-success/20",
  cancelled: "bg-surface-muted text-ink-muted ring-border",
  low: "bg-surface-muted text-ink-secondary ring-border",
  medium: "bg-accent-soft text-accent-strong ring-accent/20",
  high: "bg-warning/10 text-warning ring-warning/20",
  urgent: "bg-danger/10 text-danger ring-danger/20",
  draft: "bg-warning/10 text-warning ring-warning/20",
  final: "bg-success/10 text-success ring-success/20",
  pending: "bg-warning/10 text-warning ring-warning/20",
  inbox: "bg-warning/10 text-warning ring-warning/20",
  processed: "bg-success/10 text-success ring-success/20",
  ignored: "bg-surface-muted text-ink-muted ring-border",
  task: "bg-success/10 text-success ring-success/20",
  project_note: "bg-accent-soft text-accent-strong ring-accent/20",
  reference: "bg-ai-soft text-ai ring-ai/25",
  ignore: "bg-surface-muted text-ink-muted ring-border",
};

const labels: Record<string, string> = {
  active: "进行中",
  paused: "已暂停",
  completed: "已完成",
  archived: "已归档",
  todo: "待办",
  in_progress: "进行中",
  done: "已完成",
  cancelled: "已取消",
  low: "低",
  medium: "中",
  high: "高",
  urgent: "紧急",
  draft: "草稿",
  final: "已保存",
  pending: "待办",
  inbox: "待处理",
  processed: "已处理",
  ignored: "已忽略",
  task: "任务",
  project_note: "项目备注",
  reference: "参考",
  ignore: "忽略",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cx(
        "inline-flex h-[22px] items-center rounded-md px-1.5 text-[11px] font-medium ring-1 ring-inset",
        styles[status] ?? "bg-surface-muted text-ink-secondary ring-border",
      )}
    >
      {labels[status] ?? status}
    </span>
  );
}
