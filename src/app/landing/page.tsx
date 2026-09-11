import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { LandingPage } from "./landing-page";

export const metadata: Metadata = {
  title: "让想法，走成下一步",
  description: "让想法，走成下一步。不是计划工具，而是记住你的想法、陪你一步步推进的助手。",
};

export const dynamic = "force-dynamic";

export default async function Landing() {
  const user = await getCurrentUser();
  return <LandingPage authed={Boolean(user)} />;
}
