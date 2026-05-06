-- CreateTable
CREATE TABLE "PrivatePlanningFile" (
    "id" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "blobUrl" TEXT,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "vendorId" TEXT,
    "paymentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "scanStatus" TEXT NOT NULL DEFAULT 'unscanned',
    "uploadedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivatePlanningFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivatePlanningFileAuditLog" (
    "id" TEXT NOT NULL,
    "fileId" TEXT,
    "action" TEXT NOT NULL,
    "ipHash" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrivatePlanningFileAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PrivatePlanningFile_storageKey_key" ON "PrivatePlanningFile"("storageKey");

-- CreateIndex
CREATE INDEX "PrivatePlanningFile_status_idx" ON "PrivatePlanningFile"("status");

-- CreateIndex
CREATE INDEX "PrivatePlanningFile_vendorId_idx" ON "PrivatePlanningFile"("vendorId");

-- CreateIndex
CREATE INDEX "PrivatePlanningFile_uploadedAt_idx" ON "PrivatePlanningFile"("uploadedAt");

-- CreateIndex
CREATE INDEX "PrivatePlanningFileAuditLog_fileId_idx" ON "PrivatePlanningFileAuditLog"("fileId");

-- CreateIndex
CREATE INDEX "PrivatePlanningFileAuditLog_action_idx" ON "PrivatePlanningFileAuditLog"("action");

-- CreateIndex
CREATE INDEX "PrivatePlanningFileAuditLog_createdAt_idx" ON "PrivatePlanningFileAuditLog"("createdAt");
