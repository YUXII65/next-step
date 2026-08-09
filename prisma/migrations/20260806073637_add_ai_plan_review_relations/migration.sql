-- DropIndex
DROP INDEX "tasks_inboxItemId_key";

-- AlterTable
ALTER TABLE "inbox_items" ADD COLUMN "aiAnalyzedAt" DATETIME;
ALTER TABLE "inbox_items" ADD COLUMN "aiPlanJson" TEXT;
ALTER TABLE "inbox_items" ADD COLUMN "confirmedAt" DATETIME;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN "planOrder" INTEGER;

-- CreateTable
CREATE TABLE "review_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reviewId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "projectId" TEXT,
    "titleAtReview" TEXT NOT NULL,
    "statusAtReview" TEXT NOT NULL,
    "priorityAtReview" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "review_tasks_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "review_tasks_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "review_tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "review_next_actions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reviewId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "taskId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "review_next_actions_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "review_next_actions_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "currentMilestone" TEXT,
    "notes" TEXT,
    "createdFromInboxItemId" TEXT,
    "lastReviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "projects_createdFromInboxItemId_fkey" FOREIGN KEY ("createdFromInboxItemId") REFERENCES "inbox_items" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_projects" ("createdAt", "currentMilestone", "id", "name", "notes", "objective", "status", "updatedAt") SELECT "createdAt", "currentMilestone", "id", "name", "notes", "objective", "status", "updatedAt" FROM "projects";
DROP TABLE "projects";
ALTER TABLE "new_projects" RENAME TO "projects";
CREATE UNIQUE INDEX "projects_createdFromInboxItemId_key" ON "projects"("createdFromInboxItemId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "review_tasks_reviewId_taskId_key" ON "review_tasks"("reviewId", "taskId");

-- CreateIndex
CREATE UNIQUE INDEX "review_next_actions_taskId_key" ON "review_next_actions"("taskId");
