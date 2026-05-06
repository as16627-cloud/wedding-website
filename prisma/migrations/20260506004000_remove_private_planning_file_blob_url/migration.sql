-- Keep private file records limited to display metadata and the generated storage key.
ALTER TABLE "PrivatePlanningFile" DROP COLUMN IF EXISTS "blobUrl";
