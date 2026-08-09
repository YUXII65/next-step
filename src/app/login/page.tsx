import { loginUser, registerUser } from "@/app/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/";
  const error = typeof params.error === "string" ? params.error : "";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-background px-4">
      <div className="w-full max-w-3xl space-y-6">
        <div className="mx-auto max-w-sm text-center">
          <h1 className="text-xl font-semibold text-ink">下一步</h1>
          <p className="mt-2 text-sm leading-6 text-ink-secondary">
            用账号登录，每个人的项目、任务和复盘分开保存。
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <form
            action={loginUser}
            className="rounded-lg border border-border bg-surface p-6"
          >
            <input type="hidden" name="next" value={next} />
            <h2 className="text-sm font-semibold text-ink">登录</h2>
            <input
              name="username"
              required
              autoComplete="username"
              placeholder="用户名"
              className="mt-4 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent/20"
            />
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="密码"
              className="mt-3 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent/20"
            />
            {error === "login" ? (
              <p className="mt-3 text-sm text-danger">用户名或密码不对。</p>
            ) : null}
            <button
              type="submit"
              className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-strong"
            >
              登录
            </button>
          </form>

          <form
            action={registerUser}
            className="rounded-lg border border-border bg-surface p-6"
          >
            <input type="hidden" name="next" value={next} />
            <h2 className="text-sm font-semibold text-ink">注册</h2>
            <input
              name="username"
              required
              autoComplete="username"
              placeholder="用户名"
              className="mt-4 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent/20"
            />
            <input
              name="password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="密码（至少 6 位）"
              className="mt-3 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent/20"
            />
            <input
              name="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              placeholder="再次输入密码"
              className="mt-3 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent/20"
            />
            {error === "register" ? (
              <p className="mt-3 text-sm text-danger">
                注册失败，请检查用户名、密码长度和确认密码。
              </p>
            ) : null}
            <button
              type="submit"
              className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-lg bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-accent-strong"
            >
              注册
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
