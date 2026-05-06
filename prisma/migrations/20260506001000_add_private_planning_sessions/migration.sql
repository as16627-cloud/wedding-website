-- CreateTable
CREATE TABLE "PrivatePlanningSession" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivatePlanningSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PrivatePlanningSession_expiresAt_idx" ON "PrivatePlanningSession"("expiresAt");
