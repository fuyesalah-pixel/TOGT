-- Call-tracker teams (A1..A100) are auto-provisioned as real Groups.
ALTER TABLE "Group" ADD COLUMN "teamNumber" TEXT;

-- CreateUniqueIndex: multiple regular groups keep NULL teamNumber (Postgres
-- treats NULLs as distinct), while each team number maps to exactly one group.
CREATE UNIQUE INDEX "Group_teamNumber_key" ON "Group"("teamNumber");
