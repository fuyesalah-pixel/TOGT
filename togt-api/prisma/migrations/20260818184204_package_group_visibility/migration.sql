-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "isHidden" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Package" ADD COLUMN     "groupId" TEXT;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
