import { getCurrentUser } from "@/lib/auth";

export async function getAdminUser() {
  const user = await getCurrentUser();
  if (!user) return null;

  const configuredAdmin = process.env.ADMIN_USERNAME?.trim();
  const adminNames = new Set(
    ["YUXII", "yuxii", ...(configuredAdmin ? [configuredAdmin] : [])].map(
      (name) => name.trim().toLowerCase(),
    ),
  );
  return adminNames.has(user.username.toLowerCase()) ? user : null;
}
