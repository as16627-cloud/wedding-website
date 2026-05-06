CREATE TABLE "PrivatePlanningFileExtraction" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "extractionStatus" TEXT NOT NULL DEFAULT 'not_extracted',
    "extractedVendor" JSONB,
    "extractedDocument" JSONB,
    "confidence" JSONB,
    "warnings" JSONB,
    "errorMessage" TEXT,
    "matchedVendorId" TEXT,
    "sourceModel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "appliedAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),

    CONSTRAINT "PrivatePlanningFileExtraction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PrivatePlanningVendorSuggestion" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "extractionId" TEXT,
    "suggestionStatus" TEXT NOT NULL DEFAULT 'review_needed',
    "suggestedVendor" JSONB NOT NULL,
    "suggestedDocument" JSONB,
    "confidence" JSONB,
    "warnings" JSONB,
    "possibleMatches" JSONB,
    "matchedVendorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "reviewedAt" TIMESTAMP(3),
    "appliedAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),

    CONSTRAINT "PrivatePlanningVendorSuggestion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PrivatePlanningFileExtraction_fileId_key" ON "PrivatePlanningFileExtraction"("fileId");
CREATE INDEX "PrivatePlanningFileExtraction_extractionStatus_idx" ON "PrivatePlanningFileExtraction"("extractionStatus");
CREATE INDEX "PrivatePlanningFileExtraction_matchedVendorId_idx" ON "PrivatePlanningFileExtraction"("matchedVendorId");
CREATE INDEX "PrivatePlanningVendorSuggestion_fileId_idx" ON "PrivatePlanningVendorSuggestion"("fileId");
CREATE INDEX "PrivatePlanningVendorSuggestion_extractionId_idx" ON "PrivatePlanningVendorSuggestion"("extractionId");
CREATE INDEX "PrivatePlanningVendorSuggestion_suggestionStatus_idx" ON "PrivatePlanningVendorSuggestion"("suggestionStatus");
CREATE INDEX "PrivatePlanningVendorSuggestion_matchedVendorId_idx" ON "PrivatePlanningVendorSuggestion"("matchedVendorId");
