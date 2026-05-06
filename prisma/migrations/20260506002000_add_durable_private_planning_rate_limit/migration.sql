-- AlterTable
ALTER TABLE "PrivatePlanningSession"
ADD COLUMN "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "PrivatePlanningRateLimit" (
    "scope" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "firstFailedAt" TIMESTAMP(3) NOT NULL,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivatePlanningRateLimit_pkey" PRIMARY KEY ("scope","keyHash")
);

-- CreateIndex
CREATE INDEX "PrivatePlanningSession_lastSeenAt_idx" ON "PrivatePlanningSession"("lastSeenAt");

-- CreateIndex
CREATE INDEX "PrivatePlanningRateLimit_firstFailedAt_idx" ON "PrivatePlanningRateLimit"("firstFailedAt");

-- CreateIndex
CREATE INDEX "PrivatePlanningRateLimit_lockedUntil_idx" ON "PrivatePlanningRateLimit"("lockedUntil");
