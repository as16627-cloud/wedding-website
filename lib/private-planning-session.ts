import prisma from "@/lib/prisma";
import {
  createPrivatePlanningSessionValues,
  PRIVATE_PLANNING_IDLE_SESSION_SECONDS,
  parsePrivatePlanningSessionToken,
} from "@/lib/private-planning-auth";

export async function createPrivatePlanningSession() {
  const session = createPrivatePlanningSessionValues();

  if (!session) {
    return null;
  }

  await prisma.privatePlanningSession.create({
    data: {
      id: session.sessionId,
      expiresAt: new Date(session.expiresAt),
    },
  });

  return session.token;
}

export async function verifyPrivatePlanningSession(token?: string) {
  const claims = parsePrivatePlanningSessionToken(token);

  if (!claims) {
    return false;
  }

  const session = await prisma.privatePlanningSession.findUnique({
    where: { id: claims.sessionId },
    select: {
      expiresAt: true,
      lastSeenAt: true,
      revokedAt: true,
    },
  });

  const now = Date.now();
  const idleExpiresAt = now - PRIVATE_PLANNING_IDLE_SESSION_SECONDS * 1000;
  const sessionIsValid = Boolean(
    session &&
      !session.revokedAt &&
      session.expiresAt.getTime() > now &&
      session.lastSeenAt.getTime() > idleExpiresAt,
  );

  if (!sessionIsValid) {
    if (session && !session.revokedAt) {
      await revokePrivatePlanningSession(token);
    }

    return false;
  }

  await prisma.privatePlanningSession.updateMany({
    where: {
      id: claims.sessionId,
      revokedAt: null,
    },
    data: {
      lastSeenAt: new Date(),
    },
  });

  return true;
}

export async function revokePrivatePlanningSession(token?: string) {
  const claims = parsePrivatePlanningSessionToken(token);

  if (!claims) {
    return;
  }

  await prisma.privatePlanningSession.updateMany({
    where: {
      id: claims.sessionId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}
