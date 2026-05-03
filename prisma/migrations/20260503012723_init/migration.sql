-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "email" TEXT,
    "side" TEXT,
    "notes" TEXT,
    "inviteToken" TEXT NOT NULL,
    "rsvpResponse" TEXT NOT NULL DEFAULT 'Not responded',
    "attendingCeremony" BOOLEAN,
    "attendingReception" BOOLEAN,
    "bringingPlusOne" BOOLEAN NOT NULL DEFAULT false,
    "plusOneName" TEXT,
    "dietaryRequirements" TEXT,
    "songRequest" TEXT,
    "message" TEXT,
    "respondedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Guest_inviteToken_key" ON "Guest"("inviteToken");
