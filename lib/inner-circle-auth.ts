import "server-only";

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export const INNER_CIRCLE_HOST_COOKIE_NAME = "__Host-inner-circle-access";
export const INNER_CIRCLE_DEV_COOKIE_NAME = "inner_circle_access";
export const INNER_CIRCLE_LEGACY_COOKIE_NAMES = [INNER_CIRCLE_DEV_COOKIE_NAME];
export const INNER_CIRCLE_SESSION_SECONDS = 60 * 60 * 24 * 30;

type InnerCircleConfig = {
  passcode: string;
  sessionSecret: string;
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

function getInnerCircleConfig(): InnerCircleConfig | null {
  const passcode = process.env.INNER_CIRCLE_PASSCODE;
  const sessionSecret = process.env.INNER_CIRCLE_SESSION_SECRET;

  if (!passcode || !sessionSecret) {
    return null;
  }

  return { passcode, sessionSecret };
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function signSession(sessionId: string, expiresAt: number, sessionSecret: string) {
  return createHmac("sha256", sessionSecret)
    .update(`inner-circle:${sessionId}:${expiresAt}`)
    .digest("base64url");
}

export function isInnerCircleAuthConfigured() {
  return Boolean(getInnerCircleConfig());
}

export function verifyInnerCirclePasscode(passcode: string) {
  const config = getInnerCircleConfig();

  if (!config) {
    return false;
  }

  return safeEqual(passcode.trim(), config.passcode);
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
