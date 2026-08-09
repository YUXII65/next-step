import type { Metadata } from "next";
import { OnboardingDemo } from "./onboarding-demo";

export const metadata: Metadata = {
  title: "首次交互演示",
  description: "下一步的首次使用交互演示",
};

export default function OnboardingPage() {
  return <OnboardingDemo />;
}
