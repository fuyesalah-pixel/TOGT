-- Oromiffa (om) becomes the 4th content language: every translatable entity
-- gains Om columns alongside the existing Ar/Am ones. Plus the
-- customer-to-customer TrackingRequest consent table.
--
-- Idempotent on purpose: an earlier failed deploy attempt may have left
-- partial objects in the database, so every statement tolerates
-- pre-existing state (IF NOT EXISTS / guard blocks).

ALTER TABLE "Package" ADD COLUMN IF NOT EXISTS "titleOm" TEXT,
  ADD COLUMN IF NOT EXISTS "descriptionOm" TEXT,
  ADD COLUMN IF NOT EXISTS "includesOm" TEXT[],
  ADD COLUMN IF NOT EXISTS "excludesOm" TEXT[];
UPDATE "Package" SET "includesOm" = ARRAY[]::TEXT[], "excludesOm" = ARRAY[]::TEXT[] WHERE "includesOm" IS NULL OR "excludesOm" IS NULL;

ALTER TABLE "GalleryItem" ADD COLUMN IF NOT EXISTS "titleOm" TEXT,
  ADD COLUMN IF NOT EXISTS "categoryOm" TEXT,
  ADD COLUMN IF NOT EXISTS "locationOm" TEXT,
  ADD COLUMN IF NOT EXISTS "descriptionOm" TEXT;

ALTER TABLE "FAQItem" ADD COLUMN IF NOT EXISTS "questionOm" TEXT,
  ADD COLUMN IF NOT EXISTS "answerOm" TEXT;

-- CREATE TYPE has no IF NOT EXISTS — guard with a DO block instead.
DO $$
BEGIN
  CREATE TYPE "TrackingRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "TrackingRequest" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "status" "TrackingRequestStatus" NOT NULL DEFAULT 'PENDING',
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackingRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "TrackingRequest_requesterId_targetId_key" ON "TrackingRequest"("requesterId", "targetId");
CREATE INDEX IF NOT EXISTS "TrackingRequest_targetId_status_idx" ON "TrackingRequest"("targetId", "status");

ALTER TABLE "TrackingRequest" DROP CONSTRAINT IF EXISTS "TrackingRequest_requesterId_fkey";
ALTER TABLE "TrackingRequest" ADD CONSTRAINT "TrackingRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrackingRequest" DROP CONSTRAINT IF EXISTS "TrackingRequest_targetId_fkey";
ALTER TABLE "TrackingRequest" ADD CONSTRAINT "TrackingRequest_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
