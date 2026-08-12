import { getCurrentUser } from "@/lib/auth";

export async function getAdminUser() {
  const user = await getCurrentUser();
  if (!user) return null;

  const adminUsername = process.env.ADMIN_USERNAME?.trim();
  if (!adminUsername) return null;
  return user.username === adminUsername ? user : null;
}
