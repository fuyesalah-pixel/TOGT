-- Backup system: catalog of produced backups + schedule configuration.
CREATE TABLE "Backup" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'database',
    "status" TEXT NOT NULL DEFAULT 'queued',
    "sizeBytes" BIGINT,
    "filePath" TEXT,
    "fileName" TEXT,
    "checksum" TEXT,
    "error" TEXT,
    "triggeredBy" TEXT,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Backup_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Backup_createdAt_idx" ON "Backup"("createdAt");

CREATE TABLE "BackupSchedule" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "cron" TEXT NOT NULL DEFAULT '0 2 * * *',
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Addis_Ababa',
    "retentionDays" INTEGER NOT NULL DEFAULT 30,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BackupSchedule_pkey" PRIMARY KEY ("id")
);
