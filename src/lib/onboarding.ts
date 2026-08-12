import { prisma } from "@/lib/prisma";

const ONBOARDING_KEY = "onboarding_completed";
const ONBOARDING_SOURCE = "system";

export async function isOnboardingCompleted(userId: string) {
  const preference = await prisma.userPreference.findUnique({
    where: {
      userId_key_source: {
        userId,
        key: ONBOARDING_KEY,
        source: ONBOARDING_SOURCE,
      },
    },
    select: { value: true },
  });

  if (!preference) return true;
  return preference.value === "true";
}

export async function setOnboardingCompleted(
  userId: string,
  completed: boolean,
) {
  await prisma.userPreference.upsert({
    where: {
      userId_key_source: {
        userId,
        key: ONBOARDING_KEY,
        source: ONBOARDING_SOURCE,
      },
    },
    update: { value: completed ? "true" : "false" },
    create: {
      userId,
      key: ONBOARDING_KEY,
      source: ONBOARDING_SOURCE,
      value: completed ? "true" : "false",
    },
  });
}
