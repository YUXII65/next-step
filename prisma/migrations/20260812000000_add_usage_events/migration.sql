CREATE TABLE "usage_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "visitorId" TEXT,
    "event" TEXT NOT NULL,
    "page" TEXT,
    "detail" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "usage_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "usage_events_userId_idx" ON "usage_events"("userId");
CREATE INDEX "usage_events_event_createdAt_idx" ON "usage_events"("event", "createdAt");
CREATE INDEX "usage_events_createdAt_idx" ON "usage_events"("createdAt");

ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
