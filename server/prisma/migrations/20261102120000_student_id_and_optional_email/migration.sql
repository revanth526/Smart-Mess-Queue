-- AlterTable
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "users" ADD COLUMN "studentId" TEXT;

-- Backfill studentId from rollNo if available
UPDATE "users" SET "studentId" = "rollNo" WHERE "studentId" IS NULL AND "rollNo" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_studentId_key" ON "users"("studentId");

