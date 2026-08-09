import type { Metadata } from "next";
import { LandingPage } from "./landing-page";

export const metadata: Metadata = {
  title: "下一步",
  description: "把脑子里的一堆想法，变成今天能做的 1-3 件事。",
};

export default function Landing() {
  return <LandingPage />;
}
