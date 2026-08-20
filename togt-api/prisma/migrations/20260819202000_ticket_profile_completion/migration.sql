ALTER TABLE "User" ADD COLUMN "birthday" TIMESTAMP(3), ADD COLUMN "nationality" TEXT, ADD COLUMN "passportIssueDate" TIMESTAMP(3), ADD COLUMN "avatarUrl" TEXT;
ALTER TABLE "Ticket" ADD COLUMN "reminder24Sent" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "reminder3Sent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "TicketHistory" ADD COLUMN "changedByName" TEXT NOT NULL DEFAULT 'Unknown', ADD COLUMN "reason" TEXT NOT NULL DEFAULT 'Status changed';
