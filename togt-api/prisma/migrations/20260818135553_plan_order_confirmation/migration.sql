-- AlterTable
ALTER TABLE "TourPlanStep" ADD COLUMN     "actualAt" TIMESTAMP(3),
ADD COLUMN     "confirmationStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "confirmedById" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
ADD COLUMN     "rejectedReason" TEXT;

-- AddForeignKey
ALTER TABLE "TourPlanStep" ADD CONSTRAINT "TourPlanStep_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
