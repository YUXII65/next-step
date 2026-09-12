import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isGuestUser, requireUser } from "@/lib/auth";
import { isOnboardingCompleted } from "@/lib/onboarding";
import { FirstRunGuide } from "./first-run-guide";

export const metadata: Metadata = {
  title: "让想法，走成下一步",
  description: "说出真实想法，记住方向，然后走出第一步",
};

export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  const user = await requireUser();
  if (await isOnboardingCompleted(user.id)) {
    redirect("/workspace");
  }

  return <FirstRunGuide guest={isGuestUser(user)} />;
}
