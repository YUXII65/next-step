import type { Metadata } from "next";
import { OnboardingDemo } from "./onboarding-demo";

export const metadata: Metadata = {
  title: "让想法，走成下一步",
  description: "从一句真实想法开始，看看走走怎么陪你推进",
};

export default function OnboardingPage() {
  return <OnboardingDemo />;
}
