CREATE TABLE "GeofenceAlert" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "distanceMeters" DOUBLE PRECISION NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastAlertAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "GeofenceAlert_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "GeofenceAlert_groupId_memberId_key" ON "GeofenceAlert"("groupId", "memberId");
CREATE INDEX "GeofenceAlert_groupId_active_idx" ON "GeofenceAlert"("groupId", "active");
ALTER TABLE "GeofenceAlert" ADD CONSTRAINT "GeofenceAlert_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GeofenceAlert" ADD CONSTRAINT "GeofenceAlert_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
