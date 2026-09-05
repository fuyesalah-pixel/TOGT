-- AlterTable: Add paidAmount and remainingAmount columns, make paymentStatus nullable
ALTER TABLE "CallRecord" ADD COLUMN "paidAmount" DOUBLE PRECISION;
ALTER TABLE "CallRecord" ADD COLUMN "remainingAmount" DOUBLE PRECISION;
ALTER TABLE "CallRecord" ALTER COLUMN "paymentStatus" DROP NOT NULL;
ALTER TABLE "CallRecord" ALTER COLUMN "paymentStatus" DROP DEFAULT;