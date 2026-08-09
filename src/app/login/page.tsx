import { loginWithPassword } from "@/app/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/";
  const error = params.error === "1";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-background px-4">
      <form
        action={loginWithPassword}
        className="w-full max-w-sm rounded-lg border border-border bg-surface p-6"
      >
        <input type="hidden" name="next" value={next} />
        <h1 className="text-xl font-semibold text-ink">输入访问密码</h1>
        <p className="mt-2 text-sm leading-6 text-ink-secondary">
          下一步只对知道密码的人开放。
        </p>
        <input
          name="password"
          type="password"
          required
          autoFocus
          placeholder="访问密码"
          className="mt-5 w-full rounded-lg border border-border bg-surface-muted px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent/20"
        />
        {error ? (
          <p className="mt-3 text-sm text-danger">密码不对，再试一次。</p>
        ) : null}
        <button
          type="submit"
          className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-strong"
        >
          进入下一步
        </button>
      </form>
    </div>
  );
}
