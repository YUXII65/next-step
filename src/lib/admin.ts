import { getCurrentUser } from "@/lib/auth";

export function isAdminUsername(username: string) {
  const configuredAdmin = process.env.ADMIN_USERNAME?.trim();
  const adminNames = new Set(
    ["YUXII", "yuxii", ...(configuredAdmin ? [configuredAdmin] : [])].map(
      (name) => name.trim().toLowerCase(),
    ),
  );
  return adminNames.has(username.toLowerCase());
}

export async function getAdminUser() {
  const user = await getCurrentUser();
  if (!user) return null;

  return isAdminUsername(user.username) ? user : null;
}