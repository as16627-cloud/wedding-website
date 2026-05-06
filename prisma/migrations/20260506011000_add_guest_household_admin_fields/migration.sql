ALTER TABLE "Guest"
  ADD COLUMN "householdName" TEXT,
  ADD COLUMN "householdAddress" TEXT,
  ADD COLUMN "householdNotes" TEXT,
  ADD COLUMN "rsvpLinkSentAt" TIMESTAMP(3),
  ADD COLUMN "lastContactedAt" TIMESTAMP(3),
  ADD COLUMN "lastMessageType" TEXT;
