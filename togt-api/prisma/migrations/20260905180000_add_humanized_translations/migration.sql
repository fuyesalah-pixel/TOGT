ALTER TABLE "Package"
  ADD COLUMN "titleAr" TEXT,
  ADD COLUMN "descriptionAr" TEXT,
  ADD COLUMN "includesAr" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "excludesAr" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "titleAm" TEXT,
  ADD COLUMN "descriptionAm" TEXT,
  ADD COLUMN "includesAm" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "excludesAm" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "translationStatus" TEXT NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "translationAttempts" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "FAQItem"
  ADD COLUMN "questionAr" TEXT,
  ADD COLUMN "answerAr" TEXT,
  ADD COLUMN "questionAm" TEXT,
  ADD COLUMN "answerAm" TEXT;

ALTER TABLE "GalleryItem"
  ADD COLUMN "titleAr" TEXT,
  ADD COLUMN "categoryAr" TEXT,
  ADD COLUMN "locationAr" TEXT,
  ADD COLUMN "descriptionAr" TEXT,
  ADD COLUMN "titleAm" TEXT,
  ADD COLUMN "categoryAm" TEXT,
  ADD COLUMN "locationAm" TEXT,
  ADD COLUMN "descriptionAm" TEXT;
