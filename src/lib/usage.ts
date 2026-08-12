import { prisma } from "@/lib/prisma";

export type UsageEventInput = {
  userId: string;
  visitorId?: string | null;
  event: string;
  page?: string | null;
  detail?: string | null;
  metadata?: string | null;
};

export async function recordUsageEvent(input: UsageEventInput) {
  try {
    await prisma.usageEvent.create({
      data: {
        userId: input.userId,
        visitorId: input.visitorId ?? null,
        event: input.event,
        page: input.page ?? null,
        detail: input.detail ?? null,
        metadata: input.metadata ?? null,
      },
    });
  } catch {
    // Usage tracking must never break the main flow.
  }
}
