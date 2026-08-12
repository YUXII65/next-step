import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { isOnboardingCompleted } from "@/lib/onboarding";
import { FirstRunGuide } from "./first-run-guide";

export const metadata: Metadata = {
  title: "首次设置",
  description: "用三步完成你的第一个项目和今日任务",
};

export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  const user = await requireUser();
  if (await isOnboardingCompleted(user.id)) {
    redirect("/");
  }

  return <FirstRunGuide />;
}
