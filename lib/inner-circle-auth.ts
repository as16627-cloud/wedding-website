import "server-only";

import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";

export const INNER_CIRCLE_HOST_COOKIE_NAME = "__Host-inner-circle-access";
export const INNER_CIRCLE_DEV_COOKIE_NAME = "inner_circle_access";
export const INNER_CIRCLE_LEGACY_COOKIE_NAMES = [INNER_CIRCLE_DEV_COOKIE_NAME];
export const INNER_CIRCLE_SESSION_SECONDS = 60 * 60 * 24 * 30;

const INNER_CIRCLE_PASSCODE_HASH_SCHEME = "scrypt";
const INNER_CIRCLE_PASSCODE_HASH_VERSION = "v1";
const INNER_CIRCLE_PASSCODE_HASH_KEY_LENGTH = 64;
const INNER_CIRCLE_PASSCODE_HASH_SALT_BYTES = 16;

type InnerCircleConfig =
  | {
      passcodeHash: string;
      sessionSecret: string;
      mode: "hash";
    }
  | {
      passcode: string;
      sessionSecret: string;
      mode: "raw";
    };

export type CookieReader = {
  get(name: string): { value?: string } | undefined;
};

export const innerCircleNoStoreHeaders = {
  "Cache-Control": "no-store",
};

export function shouldUseSecureInnerCircleCookie() {
  return process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV) || process.env.INNER_CIRCLE_SECURE_COOKIES === "true";
}

export function getInnerCircleCookieName() {
  return shouldUseSecureInnerCircleCookie() ? INNER_CIRCLE_HOST_COOKIE_NAME : INNER_CIRCLE_DEV_COOKIE_NAME;
}

export function getInnerCircleCookieOptions(maxAge = INNER_CIRCLE_SESSION_SECONDS) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: shouldUseSecureInnerCircleCookie(),
    path: "/",
    maxAge,
  };
}

type ParsedPasscodeHash = {
  salt: string;
  digest: Buffer;
};

function parseInnerCirclePasscodeHash(passcodeHash: string): ParsedPasscodeHash | null {
  const parts = passcodeHash.split(":");
  const [scheme, version, salt, digest] = parts;

  if (parts.length !== 4 || scheme !== INNER_CIRCLE_PASSCODE_HASH_SCHEME || version !== INNER_CIRCLE_PASSCODE_HASH_VERSION || !salt || !digest) {
    return null;
  }

  try {
    return {
      salt,
      digest: Buffer.from(digest, "base64url"),
    };
  } catch {
    return null;
  }
}

function normalizePasscode(passcode: string) {
  return passcode.trim();
}

function getInnerCircleConfig(): InnerCircleConfig | null {
  const passcodeHash = process.env.INNER_CIRCLE_PASSCODE_HASH;
  const passcode = process.env.INNER_CIRCLE_PASSCODE;
  const sessionSecret = process.env.INNER_CIRCLE_SESSION_SECRET;

  if (!sessionSecret) {
    return null;
  }

  if (passcodeHash && parseInnerCirclePasscodeHash(passcodeHash)) {
    return { passcodeHash, sessionSecret, mode: "hash" };
  }

  if (passcode) {
    return { passcode, sessionSecret, mode: "raw" };
  }

  return null;
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function safeEqualBuffer(left: Buffer, right: Buffer) {
  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

export function createInnerCirclePasscodeHash(passcode: string) {
  const salt = randomBytes(INNER_CIRCLE_PASSCODE_HASH_SALT_BYTES).toString("base64url");
  const digest = scryptSync(normalizePasscode(passcode), salt, INNER_CIRCLE_PASSCODE_HASH_KEY_LENGTH).toString("base64url");

  return `${INNER_CIRCLE_PASSCODE_HASH_SCHEME}:${INNER_CIRCLE_PASSCODE_HASH_VERSION}:${salt}:${digest}`;
}

function signSession(sessionId: string, expiresAt: number, sessionSecret: string) {
  return createHmac("sha256", sessionSecret)
    .update(`inner-circle:${sessionId}:${expiresAt}`)
    .digest("base64url");
}

export function isInnerCircleAuthConfigured() {
  return Boolean(getInnerCircleConfig());
}

export function getInnerCircleMissingConfigMessage() {
  if (process.env.NODE_ENV === "production") {
    return "This private page is not available just yet. Please check back soon.";
  }

  return "Inner Circle access is not configured.";
}

export function verifyInnerCirclePasscode(passcode: string) {
  const config = getInnerCircleConfig();

  if (!config) {
    return false;
  }

  if (config.mode === "raw") {
    return safeEqual(normalizePasscode(passcode), config.passcode);
  }

  const parsedHash = parseInnerCirclePasscodeHash(config.passcodeHash);

  if (!parsedHash) {
    return false;
  }

  const submittedDigest = scryptSync(normalizePasscode(passcode), parsedHash.salt, parsedHash.digest.length);
  return safeEqualBuffer(submittedDigest, parsedHash.digest);
}

export function createInnerCircleSessionToken() {
  const config = getInnerCircleConfig();

  if (!config) {
    return null;
  }

  const sessionId = randomUUID();
  const expiresAt = Date.now() + INNER_CIRCLE_SESSION_SECONDS * 1000;
  const signature = signSession(sessionId, expiresAt, config.sessionSecret);

  return `${sessionId}.${expiresAt}.${signature}`;
}

export function verifyInnerCircleSessionToken(token?: string) {
  const config = getInnerCircleConfig();

  if (!config || !token) {
    return false;
  }

  const [sessionId, expiresAtValue, signature] = token.split(".");
  const expiresAt = Number(expiresAtValue);

  if (!sessionId || !Number.isFinite(expiresAt) || !signature || Date.now() > expiresAt) {
    return false;
  }

  return safeEqual(signature, signSession(sessionId, expiresAt, config.sessionSecret));
}

export function readInnerCircleSessionToken(cookies: CookieReader) {
  const activeCookie = cookies.get(getInnerCircleCookieName())?.value;

  if (activeCookie) {
    return activeCookie;
  }

  if (!shouldUseSecureInnerCircleCookie()) {
    return INNER_CIRCLE_LEGACY_COOKIE_NAMES.map((name) => cookies.get(name)?.value).find(Boolean);
  }

  return undefined;
}

export function hasInnerCircleCsrfHeader(request: Request) {
  return request.headers.get("x-inner-circle-csrf") === "1";
}
