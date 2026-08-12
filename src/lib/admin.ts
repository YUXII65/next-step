import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getAdminUser() {
  const user = await getCurrentUser();
  if (!user) return null;

  const adminUsername = process.env.ADMIN_USERNAME?.trim();
  if (adminUsername) {
    return user.username === adminUsername ? user : null;
  }

  const firstUser = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return firstUser?.id === user.id ? user : null;
}
