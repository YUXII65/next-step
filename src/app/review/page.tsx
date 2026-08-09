import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  NotebookPen,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Panel, PanelHeader } from "@/components/panel";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { ReviewDraftFeedback } from "@/components/review-draft-feedback";
import { SubmitButton } from "@/components/submit-button";
import { generateReviewDraftAction, saveReview } from "@/app/actions";
import { prisma } from "@/lib/prisma";
import { cx } from "@/lib/utils";
import { formatDate, toDateInputValue } from "@/lib/date";

export const dynamic = "force-dynamic";

const inputClass =
  "w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent/20";

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay() || 7;
  copy.setDate(copy.getDate() - day + 1);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const dateParam =
    typeof params.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(params.date)
      ? params.date
      : toDateInputValue(new Date());

  const reviews = await prisma.review.findMany({
    include: {
      tasks: {
        include: {
          project: { select: { name: true } },
        },
      },
      nextActionTasks: {
        include: { task: true },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { reviewDate: "desc" },
  });

  const selectedReview =
    reviews.find(
      (review) => toDateInputValue(review.reviewDate) === dateParam,
    ) ?? null;

  const weekStart = startOfWeek(new Date());
  const weekReviews = reviews.filter((review) => review.reviewDate >= weekStart);
  const weekCompleted = weekReviews.flatMap((review) =>
    review.tasks.filter((task) => task.statusAtReview === "done"),
  );
  const weekOpen = weekReviews.flatMap((review) =>
    review.tasks.filter(
      (task) =>
        task.statusAtReview !== "done" &&
        task.statusAtReview !== "cancelled",
    ),
  );
  const weekProjects = Array.from(
    new Set(
      weekReviews
        .flatMap((review) => review.tasks)
        .map((task) => task.project?.name)
        .filter((name): name is string => Boolean(name)),
    ),
  );

  const today = toDateInputValue(new Date());

  return (
    <>
      <PageHeader
        title="抽屉"
        description="把每天复盘收进抽屉，回看真正推进了什么。"
      />

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Panel className="min-w-0 self-start">
          <PanelHeader
            title="历史复盘"
            icon={CalendarDays}
            action={
              <span className="text-xs font-medium text-ink-muted">
                {reviews.length} 份
              </span>
            }
          />
          <div className="p-2">
            <Link
              href={`/review?date=${today}`}
              className={cx(
                "flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                !selectedReview || toDateInputValue(selectedReview.reviewDate) === today
                  ? "bg-accent-soft font-medium text-accent-strong"
                  : "text-ink-secondary hover:bg-surface-muted hover:text-ink",
              )}
            >
              <span>今天</span>
              <span className="text-xs text-ink-muted">未写</span>
            </Link>

            {reviews.length ? (
              <div className="mt-1 space-y-1">
                {reviews.map((review) => {
                  const active =
                    toDateInputValue(review.reviewDate) === dateParam;
                  const completed = review.tasks.filter(
                    (task) => task.statusAtReview === "done",
                  ).length;
                  const open = review.tasks.filter(
                    (task) =>
                      task.statusAtReview !== "done" &&
                      task.statusAtReview !== "cancelled",
                  ).length;
                  return (
                    <Link
                      key={review.id}
                      href={`/review?date=${toDateInputValue(review.reviewDate)}`}
                      className={cx(
                        "flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-accent-soft font-medium text-accent-strong"
                          : "text-ink-secondary hover:bg-surface-muted hover:text-ink",
                      )}
                    >
                      <span className="min-w-0 truncate">
                        {formatDate(review.reviewDate)}
                      </span>
                      <span className="shrink-0 text-xs text-ink-muted">
                        {completed} / {open}
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="px-3 py-6 text-center text-sm text-ink-muted">
                还没有历史复盘
              </p>
            )}
          </div>
        </Panel>

        <div className="min-w-0 space-y-6">
          <Panel>
            <PanelHeader
              title={selectedReview ? "当日复盘" : "写今日复盘"}
              icon={NotebookPen}
              action={
                selectedReview ? (
                  <StatusBadge status={selectedReview.status} />
                ) : null
              }
            />

            {selectedReview ? (
              <>
                <ReviewDraftFeedback reviewId={selectedReview.id} />
                <form
                  action={generateReviewDraftAction}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4"
                >
                  <input
                    type="hidden"
                    name="reviewDate"
                    value={toDateInputValue(selectedReview.reviewDate)}
                  />
                  <p className="text-sm text-ink-secondary">
                    可以重新生成草稿，然后手动修改。
                  </p>
                  <SubmitButton className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-ink-secondary transition-colors hover:border-accent hover:text-accent">
                    <Sparkles className="size-4" />
                    下一步：重新生成草稿
                  </SubmitButton>
                </form>

                <form action={saveReview} className="space-y-3 p-4">
                  <input type="hidden" name="id" value={selectedReview.id} />
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-ink-secondary">
                      当日总结
                    </span>
                    <textarea
                      name="summary"
                      required
                      rows={6}
                      defaultValue={selectedReview.summary}
                      className={inputClass}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-ink-secondary">
                      下一步建议（每行一条）
                    </span>
                    <textarea
                      name="nextActions"
                      rows={4}
                      defaultValue={selectedReview.nextActions ?? ""}
                      className={inputClass}
                    />
                  </label>
                  <div className="flex justify-end">
                    <SubmitButton className="inline-flex h-9 items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60">
                      下一步：保存复盘
                    </SubmitButton>
                  </div>
                </form>
              </>
            ) : (
              <form action={generateReviewDraftAction} className="space-y-4 p-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-ink-secondary">
                    日期
                  </span>
                  <input
                    name="reviewDate"
                    type="date"
                    defaultValue={dateParam}
                    className={inputClass}
                  />
                </label>
                <div className="rounded-lg bg-accent-soft p-3 text-xs leading-5 text-accent-strong">
                  未配置 DeepSeek Key 时使用本地规则生成草稿；配置后会调用 AI。
                </div>
                <SubmitButton className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60">
                  <CalendarDays className="size-4" />
                  下一步：生成复盘
                </SubmitButton>
              </form>
            )}
          </Panel>

          {selectedReview ? (
            <Panel>
              <PanelHeader
                title="当日任务"
                icon={NotebookPen}
                action={
                  <span className="text-xs font-medium text-ink-muted">
                    {selectedReview.tasks.length} 条
                  </span>
                }
              />
              {selectedReview.tasks.length ? (
                <div className="divide-y divide-border">
                  {selectedReview.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-2.5 px-4 py-3 text-sm text-ink"
                    >
                      {task.statusAtReview === "done" ? (
                        <CheckCircle2 className="size-4 shrink-0 text-success" />
                      ) : (
                        <CircleDashed className="size-4 shrink-0 text-warning" />
                      )}
                      <span className="min-w-0 flex-1 truncate">
                        {task.titleAtReview}
                      </span>
                      {task.project?.name ? (
                        <span className="shrink-0 text-xs text-ink-muted">
                          {task.project.name}
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={NotebookPen}
                  title="当天没有任务记录"
                  hint="完成今日任务后，这里会自动显示完成情况。"
                />
              )}
            </Panel>
          ) : null}

          <Panel>
            <PanelHeader
              title="本周回看"
              icon={CalendarDays}
              action={
                <span className="text-xs font-medium text-ink-muted">
                  {weekReviews.length} 份每日复盘
                </span>
              }
            />
            <div className="grid gap-3 p-4 sm:grid-cols-3">
              <div className="rounded-lg border border-success/20 bg-success/10 px-3 py-3">
                <p className="text-xs text-success">本周完成</p>
                <p className="mt-1 text-2xl font-semibold text-ink">
                  {weekCompleted.length}
                </p>
              </div>
              <div className="rounded-lg border border-warning/20 bg-warning/10 px-3 py-3">
                <p className="text-xs text-warning">待推进</p>
                <p className="mt-1 text-2xl font-semibold text-ink">
                  {weekOpen.length}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-surface-muted px-3 py-3">
                <p className="text-xs text-ink-secondary">涉及项目</p>
                <p className="mt-1 text-2xl font-semibold text-ink">
                  {weekProjects.length}
                </p>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
