export function RouteLoading() {
  return (
    <div role="status" aria-label="页面加载中" className="space-y-5">
      <div className="space-y-2">
        <div className="h-2.5 w-16 animate-[zouzou-soft-pulse_1.6s_ease-in-out_infinite] rounded bg-surface-muted" />
        <div className="h-5 w-40 animate-[zouzou-soft-pulse_1.6s_ease-in-out_infinite] rounded bg-surface-muted" />
      </div>
      <div className="space-y-4">
        <div className="zouzou-panel h-36 rounded-xl p-4">
          <div className="h-4 w-28 animate-[zouzou-soft-pulse_1.6s_ease-in-out_infinite] rounded bg-surface-muted" />
          <div className="mt-4 space-y-2">
            <div className="h-8 animate-[zouzou-soft-pulse_1.6s_ease-in-out_infinite] rounded bg-surface-muted" />
            <div className="h-8 animate-[zouzou-soft-pulse_1.6s_ease-in-out_infinite] rounded bg-surface-muted" />
          </div>
        </div>
        <div className="zouzou-panel h-52 rounded-xl p-4">
          <div className="h-4 w-32 animate-[zouzou-soft-pulse_1.6s_ease-in-out_infinite] rounded bg-surface-muted" />
          <div className="mt-4 space-y-2">
            <div className="h-10 animate-[zouzou-soft-pulse_1.6s_ease-in-out_infinite] rounded bg-surface-muted" />
            <div className="h-10 animate-[zouzou-soft-pulse_1.6s_ease-in-out_infinite] rounded bg-surface-muted" />
            <div className="h-10 animate-[zouzou-soft-pulse_1.6s_ease-in-out_infinite] rounded bg-surface-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
