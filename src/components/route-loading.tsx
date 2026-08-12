export function RouteLoading() {
  return (
    <div role="status" aria-label="页面加载中" className="space-y-5">
      <div className="space-y-2">
        <div className="h-2.5 w-16 animate-pulse rounded bg-surface-muted" />
        <div className="h-5 w-40 animate-pulse rounded bg-surface-muted" />
      </div>
      <div className="space-y-4">
        <div className="h-36 rounded-lg border border-border bg-surface p-4">
          <div className="h-4 w-28 animate-pulse rounded bg-surface-muted" />
          <div className="mt-4 space-y-2">
            <div className="h-8 animate-pulse rounded bg-surface-muted" />
            <div className="h-8 animate-pulse rounded bg-surface-muted" />
          </div>
        </div>
        <div className="h-52 rounded-lg border border-border bg-surface p-4">
          <div className="h-4 w-32 animate-pulse rounded bg-surface-muted" />
          <div className="mt-4 space-y-2">
            <div className="h-10 animate-pulse rounded bg-surface-muted" />
            <div className="h-10 animate-pulse rounded bg-surface-muted" />
            <div className="h-10 animate-pulse rounded bg-surface-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
