-- CreateEnum
CREATE TYPE "FlightOrderStatus" AS ENUM ('HELD', 'AWAITING_TICKET', 'CONFIRMED', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "FlightOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "duffelOfferRequestId" TEXT,
    "duffelOfferId" TEXT NOT NULL,
    "duffelOrderId" TEXT,
    "duffelBookingRef" TEXT,
    "ticketId" TEXT,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "departureDate" TEXT NOT NULL,
    "returnDate" TEXT,
    "cabinClass" TEXT NOT NULL DEFAULT 'economy',
    "tripSummary" JSONB NOT NULL,
    "passengers" JSONB NOT NULL,
    "duffelAmount" DOUBLE PRECISION NOT NULL,
    "duffelCurrency" TEXT NOT NULL,
    "sellAmount" DOUBLE PRECISION NOT NULL,
    "sellCurrency" TEXT NOT NULL DEFAULT 'ETB',
    "paymentRequiredBy" TIMESTAMP(3),
    "status" "FlightOrderStatus" NOT NULL DEFAULT 'HELD',
    "paymentId" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlightOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FlightOrder_duffelOrderId_key" ON "FlightOrder"("duffelOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "FlightOrder_ticketId_key" ON "FlightOrder"("ticketId");

-- CreateIndex
CREATE INDEX "FlightOrder_userId_createdAt_idx" ON "FlightOrder"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "FlightOrder_paymentId_idx" ON "FlightOrder"("paymentId");

-- AddForeignKey
ALTER TABLE "FlightOrder" ADD CONSTRAINT "FlightOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;