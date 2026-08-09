-- Clean legacy shared workspace before adding per-user ownership.
TRUNCATE TABLE
  "ai_usage_logs",
  "review_next_actions",
  "review_tasks",
  "reviews",
  "ai_feedback_events",
  "user_preferences",
  "ai_plan_feedbacks",
  "inbox_items",
  "tasks",
  "projects"
CASCADE;

-- DropIndex
DROP INDEX "user_preferences_key_source_key";

-- DropIndex
DROP INDEX "reviews_reviewDate_key";

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "inbox_items" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ai_plan_feedbacks" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "user_preferences" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ai_feedback_events" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "review_tasks" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "review_next_actions" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ai_usage_logs" ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "projects_userId_idx" ON "projects"("userId");

-- CreateIndex
CREATE INDEX "tasks_userId_idx" ON "tasks"("userId");

-- CreateIndex
CREATE INDEX "inbox_items_userId_idx" ON "inbox_items"("userId");

-- CreateIndex
CREATE INDEX "ai_plan_feedbacks_userId_idx" ON "ai_plan_feedbacks"("userId");

-- CreateIndex
CREATE INDEX "user_preferences_userId_idx" ON "user_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_preferences_userId_key_source_key" ON "user_preferences"("userId", "key", "source");

-- CreateIndex
CREATE INDEX "ai_feedback_events_userId_idx" ON "ai_feedback_events"("userId");

-- CreateIndex
CREATE INDEX "reviews_userId_idx" ON "reviews"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_userId_reviewDate_key" ON "reviews"("userId", "reviewDate");

-- CreateIndex
CREATE INDEX "review_tasks_userId_idx" ON "review_tasks"("userId");

-- CreateIndex
CREATE INDEX "review_next_actions_userId_idx" ON "review_next_actions"("userId");

-- CreateIndex
CREATE INDEX "ai_usage_logs_userId_idx" ON "ai_usage_logs"("userId");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inbox_items" ADD CONSTRAINT "inbox_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_plan_feedbacks" ADD CONSTRAINT "ai_plan_feedbacks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_feedback_events" ADD CONSTRAINT "ai_feedback_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_tasks" ADD CONSTRAINT "review_tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_next_actions" ADD CONSTRAINT "review_next_actions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
