import { AuthCard } from "@/components/auth-card";
import { BrandMark } from "@/components/brand-mark";

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
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <BrandMark className="size-12" />
          </div>
          <h1 className="text-xl font-semibold text-ink">走走</h1>
          <p className="mt-2 text-sm leading-6 text-ink-secondary">
            让想法，走成下一步。用账号登录，数据分开保存。
          </p>
        </div>

        <AuthCard next={next} error={error} />
      </div>
    </div>
  );
}
