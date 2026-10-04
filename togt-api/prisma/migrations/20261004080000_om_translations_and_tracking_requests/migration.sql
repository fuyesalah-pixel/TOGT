-- Oromiffa (om) becomes the 4th content language: every translatable entity
-- gains Om columns alongside the existing Ar/Am ones.
ALTER TABLE "Package" ADD COLUMN "titleOm" TEXT,
  ADD COLUMN "descriptionOm" TEXT,
  ADD COLUMN "includesOm" TEXT[],
  ADD COLUMN "excludesOm" TEXT[];
UPDATE "Package" SET "includesOm" = ARRAY[]::TEXT[], "excludesOm" = ARRAY[]::TEXT[] WHERE "includesOm" IS NULL OR "excludesOm" IS NULL;

ALTER TABLE "GalleryItem" ADD COLUMN "titleOm" TEXT,
  ADD COLUMN "categoryOm" TEXT,
  ADD COLUMN "locationOm" TEXT,
  ADD COLUMN "descriptionOm" TEXT;

ALTER TABLE "FAQItem" ADD COLUMN "questionOm" TEXT,
  ADD COLUMN "answerOm" TEXT;

-- Customer-to-customer tracking consent (item 2): A sends a request to B,
-- B accepts/declines; PENDING until B responds. Workers/admins bypass.
CREATE TYPE "TrackingRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED');

CREATE TABLE "TrackingRequest" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "status" "TrackingRequestStatus" NOT NULL DEFAULT 'PENDING',
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackingRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TrackingRequest_requesterId_targetId_key" ON "TrackingRequest"("requesterId", "targetId");
CREATE INDEX "TrackingRequest_targetId_status_idx" ON "TrackingRequest"("targetId", "status");

ALTER TABLE "TrackingRequest" ADD CONSTRAINT "TrackingRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TrackingRequest" ADD CONSTRAINT "TrackingRequest_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
