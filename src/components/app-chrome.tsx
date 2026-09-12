"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { CommandPalette } from "@/components/command-palette";
import type { ProfileUser } from "@/components/profile-card";

/**
 * 这些页面是整屏的（落地页 / 登录 / 引导 / 游客注册），不该出现应用导航。
 * 之前他们用 fixed 覆盖，但遮罩是透明的，侧栏和底部导航会透出来，
 * 落地页左上角就会出现两个 logo 重叠。
 */
const FULLSCREEN_ROUTES = [
  "/landing",
  "/login",
  "/onboarding",
  "/welcome",
  "/guest/register",
];

export function AppChrome({
  isAdmin,
  user,
}: {
  isAdmin: boolean;
  user: ProfileUser | null;
}) {
  const pathname = usePathname();
  const fullscreen = FULLSCREEN_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  if (fullscreen) return null;

  return (
    <>
      <Sidebar isAdmin={isAdmin} user={user} />
      <CommandPalette isAdmin={isAdmin} />
    </>
  );
}