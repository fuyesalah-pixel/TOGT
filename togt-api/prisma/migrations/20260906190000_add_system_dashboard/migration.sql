CREATE TABLE "SystemSecret" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "ciphertext" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastTestedAt" TIMESTAMP(3),
    "lastTestStatus" TEXT,
    "rotatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SystemSecret_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SystemAuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "outcome" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SystemAuditLog_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SystemMaintenance" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT NOT NULL DEFAULT 'TOGT is temporarily unavailable for maintenance.',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SystemMaintenance_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SystemBackup" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "sizeBytes" BIGINT,
    "checksum" TEXT,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdById" TEXT,
    CONSTRAINT "SystemBackup_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SystemSecret_provider_key" ON "SystemSecret"("provider");
CREATE INDEX "SystemAuditLog_createdAt_idx" ON "SystemAuditLog"("createdAt");
CREATE INDEX "SystemAuditLog_actorId_createdAt_idx" ON "SystemAuditLog"("actorId", "createdAt");
CREATE INDEX "SystemBackup_startedAt_idx" ON "SystemBackup"("startedAt");
