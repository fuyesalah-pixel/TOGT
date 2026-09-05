-- CreateTable
CREATE TABLE "CallRecord" (
    "id" TEXT NOT NULL,
    "teamNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "fatherName" TEXT,
    "passportNumber" TEXT,
    "passportFileUrl" TEXT,
    "otherFileUrl" TEXT,
    "serviceType" TEXT NOT NULL DEFAULT 'CONSULTING',
    "packageTitle" TEXT,
    "tripType" TEXT,
    "destination" TEXT,
    "departureDate" TIMESTAMP(3),
    "tripDuration" TEXT,
    "passengerCount" INTEGER,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "flightNumber" TEXT,
    "flightBookingStatus" TEXT,
    "airline" TEXT,
    "additionalInfo" TEXT,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CallRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallRecordHistory" (
    "id" TEXT NOT NULL,
    "callRecordId" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "changedByName" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "fromValue" TEXT,
    "toValue" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallRecordHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CallRecord_teamNumber_key" ON "CallRecord"("teamNumber");

-- CreateIndex
CREATE INDEX "CallRecord_createdById_createdAt_idx" ON "CallRecord"("createdById", "createdAt");

-- CreateIndex
CREATE INDEX "CallRecord_teamNumber_idx" ON "CallRecord"("teamNumber");

-- CreateIndex
CREATE INDEX "CallRecordHistory_callRecordId_createdAt_idx" ON "CallRecordHistory"("callRecordId", "createdAt");

-- AddForeignKey
ALTER TABLE "CallRecord" ADD CONSTRAINT "CallRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallRecord" ADD CONSTRAINT "CallRecord_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallRecordHistory" ADD CONSTRAINT "CallRecordHistory_callRecordId_fkey" FOREIGN KEY ("callRecordId") REFERENCES "CallRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallRecordHistory" ADD CONSTRAINT "CallRecordHistory_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;