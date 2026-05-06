import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export const PRIVATE_PLANNING_HOST_COOKIE_NAME = "__Host-private-planning-session";
export const PRIVATE_PLANNING_DEV_COOKIE_NAME = "private_planning_session";
export const PRIVATE_PLANNING_LEGACY_COOKIE_NAMES = [PRIVATE_PLANNING_DEV_COOKIE_NAME];
export const PRIVATE_PLANNING_SESSION_SECONDS = 60 * 60 * 12;
export const PRIVATE_PLANNING_IDLE_SESSION_SECONDS = 60 * 60 * 2;

type PrivatePlanningConfig = {
  passcode: string;
  sessionSecret: string;
};

export type CookieReader = {
  get(name: string): { value?: string } | undefined;
};

export const privatePlanningNoStoreHeaders = {
  "Cache-Control": "no-store",
};

export function shouldUseSecurePrivatePlanningCookie() {
  return process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV) || process.env.PRIVATE_PLANNING_SECURE_COOKIES === "true";
}

export function getPrivatePlanningCookieName() {
  return shouldUseSecurePrivatePlanningCookie() ? PRIVATE_PLANNING_HOST_COOKIE_NAME : PRIVATE_PLANNING_DEV_COOKIE_NAME;
}

export function getPrivatePlanningCookieOptions(maxAge = PRIVATE_PLANNING_SESSION_SECONDS) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: shouldUseSecurePrivatePlanningCookie(),
    path: "/",
    maxAge,
  };
}

function getPrivatePlanningConfig(): PrivatePlanningConfig | null {
  const passcode = process.env.PRIVATE_PLANNING_PASSCODE;
  const sessionSecret = process.env.PRIVATE_PLANNING_SESSION_SECRET;

  if (!passcode || !sessionSecret) {
    return null;
  }

  return { passcode, sessionSecret };
}

type PrivatePlanningSessionClaims = {
  sessionId: string;
  expiresAt: number;
};

function signSession(sessionId: string, expiresAt: number, sessionSecret: string) {
  return createHmac("sha256", sessionSecret)
    .update(`private-planning:${sessionId}:${expiresAt}`)
    .digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyPrivatePlanningPasscode(passcode: string) {
  const config = getPrivatePlanningConfig();

  if (!config) {
    return false;
  }

  return safeEqual(passcode.trim(), config.passcode);
}

export function isPrivatePlanningAuthConfigured() {
  return Boolean(getPrivatePlanningConfig());
}

export function createPrivatePlanningSessionValues() {
  const config = getPrivatePlanningConfig();

  if (!config) {
    return null;
  }

  const sessionId = randomUUID();
  const expiresAt = Date.now() + PRIVATE_PLANNING_SESSION_SECONDS * 1000;
  const signature = signSession(sessionId, expiresAt, config.sessionSecret);

  return {
    sessionId,
    expiresAt,
    token: `${sessionId}.${expiresAt}.${signature}`,
  };
}

export function parsePrivatePlanningSessionToken(token?: string): PrivatePlanningSessionClaims | null {
  const config = getPrivatePlanningConfig();

  if (!config || !token) {
    return null;
  }

  const [sessionId, expiresAtValue, signature] = token.split(".");
  const expiresAt = Number(expiresAtValue);

  if (!sessionId || !Number.isFinite(expiresAt) || !signature || Date.now() > expiresAt) {
    return null;
  }

  if (!safeEqual(signature, signSession(sessionId, expiresAt, config.sessionSecret))) {
    return null;
  }

  return { sessionId, expiresAt };
}

export function readPrivatePlanningSessionToken(cookies: CookieReader) {
  const activeCookie = cookies.get(getPrivatePlanningCookieName())?.value;

  if (activeCookie) {
    return activeCookie;
  }

  if (!shouldUseSecurePrivatePlanningCookie()) {
    return PRIVATE_PLANNING_LEGACY_COOKIE_NAMES.map((name) => cookies.get(name)?.value).find(Boolean);
  }

  return undefined;
}

export function isSameOriginRequest(request: Request) {
  const requestUrl = new URL(request.url);
  const protocol = request.headers.get("x-forwarded-proto") ?? requestUrl.protocol.replace(":", "");
  const expectedOrigins = new Set([requestUrl.origin]);
  const host = request.headers.get("host");
  const forwardedHost = request.headers.get("x-forwarded-host");

  if (host) {
    expectedOrigins.add(`${protocol}://${host}`);
  }

  if (forwardedHost) {
    expectedOrigins.add(`${protocol}://${forwardedHost}`);
  }

  const origin = request.headers.get("origin");

  if (origin) {
    return expectedOrigins.has(origin);
  }

  const referer = request.headers.get("referer");

  if (!referer) {
    return false;
  }

  try {
    return expectedOrigins.has(new URL(referer).origin);
  } catch {
    return false;
  }
}

export function hasPrivatePlanningCsrfHeader(request: Request) {
  return request.headers.get("x-private-planning-csrf") === "1";
}
