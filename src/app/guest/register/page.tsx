import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { GuestRegisterCard } from "@/components/guest-register-card";
import { BrandMark } from "@/components/brand-mark";
import { getCurrentUser, isGuestUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "注册保存",
  description: "把游客体验保存为正式账号",
};

export const dynamic = "force-dynamic";

export default async function GuestRegisterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=%2Fguest%2Fregister");
  if (!isGuestUser(user)) redirect("/");

  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : "";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <BrandMark className="size-12" />
          </div>
          <h1 className="text-xl font-semibold text-ink">走走</h1>
          <p className="mt-2 text-sm leading-6 text-ink-secondary">
            注册一个账号，让想法和计划继续保存。
          </p>
        </div>

        <GuestRegisterCard error={error} />
      </div>
    </div>
  );
}
