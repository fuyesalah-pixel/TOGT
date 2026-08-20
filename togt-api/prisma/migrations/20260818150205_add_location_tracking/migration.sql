-- CreateTable
CREATE TABLE "LocationTracking" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LocationTracking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LocationTracking_groupId_userId_createdAt_idx" ON "LocationTracking"("groupId", "userId", "createdAt");

-- AddForeignKey
ALTER TABLE "LocationTracking" ADD CONSTRAINT "LocationTracking_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationTracking" ADD CONSTRAINT "LocationTracking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
