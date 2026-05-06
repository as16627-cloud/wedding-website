import { createHash } from "node:crypto";
import prisma from "@/lib/prisma";

const WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;
const IP_MAX_FAILED_ATTEMPTS = 5;
const TARGET_MAX_FAILED_ATTEMPTS = 30;
const PRIVATE_PLANNING_LOGIN_TARGET = "private-planning-login";

type RateLimitScope = {
  scope: "ip" | "target";
  key: string;
  maxFailedAttempts: number;
};

type RateLimitOptions = {
  target?: string;
};

type RateLimitRecord = {
  scope: string;
  failedAttempts: number;
  firstFailedAt: Date;
  lockedUntil: Date | null;
};

function hashRateLimitKey(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeIdentity(value: string) {
  return value.trim().toLowerCase() || "unknown";
}

function getTargetKey(options?: RateLimitOptions) {
  return normalizeIdentity(options?.target ?? PRIVATE_PLANNING_LOGIN_TARGET);
}

function getRateLimitScopes(identity: string, options?: RateLimitOptions): RateLimitScope[] {
  return [
    {
      scope: "ip",
      key: normalizeIdentity(identity),
      maxFailedAttempts: IP_MAX_FAILED_ATTEMPTS,
    },
    {
      scope: "target",
      key: getTargetKey(options),
      maxFailedAttempts: TARGET_MAX_FAILED_ATTEMPTS,
    },
  ];
}

function retryAfterSeconds(lockedUntil: Date | null, now: number) {
  return lockedUntil && lockedUntil.getTime() > now ? Math.ceil((lockedUntil.getTime() - now) / 1000) : 0;
}

function delayForFailedAttempts(failedAttempts: number) {
  return Math.min(failedAttempts * 350, 1600);
}

function summarizeLimit(records: RateLimitRecord[], now: number) {
  const activeLocks = records
    .map((record) => ({
      scope: record.scope,
      retryAfterSeconds: retryAfterSeconds(record.lockedUntil, now),
    }))
    .filter((record) => record.retryAfterSeconds > 0);

  if (activeLocks.length === 0) {
    return {
      allowed: true,
      retryAfterSeconds: 0,
      limitedScopes: [] as string[],
    };
  }

  return {
    allowed: false,
    retryAfterSeconds: Math.max(...activeLocks.map((record) => record.retryAfterSeconds)),
    limitedScopes: activeLocks.map((record) => record.scope),
  };
}

async function readRateLimitRecords(scopes: RateLimitScope[]) {
  return prisma.privatePlanningRateLimit.findMany({
    where: {
      OR: scopes.map((scope) => ({
        scope: scope.scope,
        keyHash: hashRateLimitKey(scope.key),
      })),
    },
    select: {
      scope: true,
      failedAttempts: true,
      firstFailedAt: true,
      lockedUntil: true,
    },
  });
}

async function recordFailureForScope(scope: RateLimitScope, now: Date) {
  const keyHash = hashRateLimitKey(scope.key);
  const windowStart = new Date(now.getTime() - WINDOW_MS);
  const lockedUntil = new Date(now.getTime() + LOCKOUT_MS);
  const records = await prisma.$queryRaw<RateLimitRecord[]>`
    INSERT INTO "PrivatePlanningRateLimit"
      ("scope", "keyHash", "failedAttempts", "firstFailedAt", "lockedUntil", "updatedAt")
    VALUES
      (${scope.scope}, ${keyHash}, 1, CAST(${now} AS timestamp), NULL::timestamp, CAST(${now} AS timestamp))
    ON CONFLICT ("scope", "keyHash") DO UPDATE SET
      "failedAttempts" = CASE
        WHEN "PrivatePlanningRateLimit"."firstFailedAt" < CAST(${windowStart} AS timestamp) THEN 1
        ELSE "PrivatePlanningRateLimit"."failedAttempts" + 1
      END,
      "firstFailedAt" = CASE
        WHEN "PrivatePlanningRateLimit"."firstFailedAt" < CAST(${windowStart} AS timestamp) THEN CAST(${now} AS timestamp)
        ELSE "PrivatePlanningRateLimit"."firstFailedAt"
      END,
      "lockedUntil" = CASE
        WHEN (
          CASE
            WHEN "PrivatePlanningRateLimit"."firstFailedAt" < CAST(${windowStart} AS timestamp) THEN 1
            ELSE "PrivatePlanningRateLimit"."failedAttempts" + 1
          END
        ) >= ${scope.maxFailedAttempts} THEN CAST(${lockedUntil} AS timestamp)
        ELSE NULL::timestamp
      END,
      "updatedAt" = CAST(${now} AS timestamp)
    RETURNING "scope", "failedAttempts", "firstFailedAt", "lockedUntil"
  `;
  const record = records[0] ?? {
    scope: scope.scope,
    failedAttempts: 1,
    firstFailedAt: now,
    lockedUntil: null,
  };

  return {
    scope: scope.scope,
    failedAttempts: record.failedAttempts,
    locked: Boolean(record.lockedUntil),
    retryAfterSeconds: retryAfterSeconds(record.lockedUntil, now.getTime()),
    delayMs: delayForFailedAttempts(record.failedAttempts),
  };
}

export function getPrivatePlanningRateLimitIdentity(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || request.headers.get("x-real-ip") || "unknown";
}

export async function checkPrivatePlanningLoginLimit(identity: string, options?: RateLimitOptions) {
  const now = Date.now();
  const scopes = getRateLimitScopes(identity, options);
  const records = await readRateLimitRecords(scopes);

  return summarizeLimit(records, now);
}

export async function recordPrivatePlanningLoginFailure(identity: string, options?: RateLimitOptions) {
  const now = new Date();
  const scopes = getRateLimitScopes(identity, options);
  const results = await Promise.all(scopes.map((scope) => recordFailureForScope(scope, now)));
  const limitedScopes = results.filter((result) => result.locked).map((result) => result.scope);

  return {
    failedAttempts: Math.max(...results.map((result) => result.failedAttempts)),
    locked: limitedScopes.length > 0,
    retryAfterSeconds: Math.max(...results.map((result) => result.retryAfterSeconds)),
    delayMs: Math.max(...results.map((result) => result.delayMs)),
    limitedScopes,
    logKey: hashRateLimitKey(`${normalizeIdentity(identity)}:${getTargetKey(options)}`).slice(0, 12),
  };
}

export async function recordPrivatePlanningLoginSuccess(identity: string, options?: RateLimitOptions) {
  const scopes = getRateLimitScopes(identity, options);

  await prisma.privatePlanningRateLimit.deleteMany({
    where: {
      OR: scopes.map((scope) => ({
        scope: scope.scope,
        keyHash: hashRateLimitKey(scope.key),
      })),
    },
  });
}

export async function clearPrivatePlanningLoginLimit(identity: string, options?: RateLimitOptions) {
  await recordPrivatePlanningLoginSuccess(identity, options);
}
