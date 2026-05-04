-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "email" TEXT,
    "side" TEXT,
    "notes" TEXT,
    "inviteToken" TEXT NOT NULL,
    "rsvpToken" TEXT,
    "invitedToCeremony" BOOLEAN NOT NULL DEFAULT true,
    "invitedToReception" BOOLEAN NOT NULL DEFAULT true,
    "plusOneAllowed" BOOLEAN NOT NULL DEFAULT false,
    "smsSentAt" TIMESTAMP(3),
    "rsvpResponse" TEXT NOT NULL DEFAULT 'Not responded',
    "rsvpStatus" TEXT NOT NULL DEFAULT 'Not responded',
    "attendingCeremony" BOOLEAN,
    "attendingReception" BOOLEAN,
    "bringingPlusOne" BOOLEAN NOT NULL DEFAULT false,
    "ceremonyResponse" BOOLEAN,
    "receptionResponse" BOOLEAN,
    "plusOneResponse" BOOLEAN,
    "plusOneName" TEXT,
    "dietaryRequirements" TEXT,
    "guestDietary" TEXT,
    "plusOneDietary" TEXT,
    "songRequest" TEXT,
    "message" TEXT,
    "guestMessage" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Guest_inviteToken_key" ON "Guest"("inviteToken");

-- CreateIndex
CREATE UNIQUE INDEX "Guest_rsvpToken_key" ON "Guest"("rsvpToken");
