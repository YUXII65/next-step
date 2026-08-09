import { PrismaClient } from "@prisma/client";

const args = process.argv.slice(2);
if (!args.includes("--yes")) {
  console.error("This command clears all user data. Run with --yes to proceed.");
  process.exit(1);
}

const prisma = new PrismaClient();

await prisma.$transaction([
  prisma.reviewNextAction.deleteMany(),
  prisma.reviewTask.deleteMany(),
  prisma.aiFeedbackEvent.deleteMany(),
  prisma.aiPlanFeedback.deleteMany(),
  prisma.task.deleteMany(),
  prisma.inboxItem.deleteMany(),
  prisma.review.deleteMany(),
  prisma.project.deleteMany(),
  prisma.userPreference.deleteMany(),
]);

console.log("All user data cleared.");
await prisma.$disconnect();
