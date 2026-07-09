-- CreateEnum
CREATE TYPE "TaskKind" AS ENUM ('REQUEST', 'OFFER');

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "kind" "TaskKind" NOT NULL DEFAULT 'REQUEST',
ADD COLUMN     "sourceGigId" TEXT;

-- CreateIndex
CREATE INDEX "tasks_campusId_kind_status_createdAt_idx" ON "tasks"("campusId", "kind", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_sourceGigId_fkey" FOREIGN KEY ("sourceGigId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
