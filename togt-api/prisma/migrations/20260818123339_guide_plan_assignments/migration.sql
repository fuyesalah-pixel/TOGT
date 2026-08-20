-- AlterTable
ALTER TABLE "GroupMember" ADD COLUMN     "assignmentStatus" TEXT NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "TourPlanStep" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "estimatedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TourPlanStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TourPlanStep_groupId_estimatedAt_idx" ON "TourPlanStep"("groupId", "estimatedAt");

-- AddForeignKey
ALTER TABLE "TourPlanStep" ADD CONSTRAINT "TourPlanStep_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
