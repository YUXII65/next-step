-- CreateTable
CREATE TABLE "ai_plan_feedbacks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inboxItemId" TEXT,
    "action" TEXT NOT NULL,
    "planJson" TEXT NOT NULL,
    "editedJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ai_plan_feedbacks_inboxItemId_fkey" FOREIGN KEY ("inboxItemId") REFERENCES "inbox_items" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
