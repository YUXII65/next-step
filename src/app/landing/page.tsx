import type { Metadata } from "next";
import { LandingPage } from "./landing-page";

export const metadata: Metadata = {
  title: "让想法，走成下一步",
  description: "让想法，走成下一步。",
};

export default function Landing() {
  return <LandingPage />;
}
