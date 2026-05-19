import { NextResponse } from "next/server";
import {
  createInnerCircleSessionToken,
  getInnerCircleCookieName,
  getInnerCircleCookieOptions,
  getInnerCircleMissingConfigMessage,
  INNER_CIRCLE_LEGACY_COOKIE_NAMES,
  innerCircleNoStoreHeaders,
  isInnerCircleAuthConfigured,
  verifyInnerCirclePasscode,
} from "@/lib/inner-circle-auth";
import { isSameOriginRequest } from "@/lib/private-planning-auth";
import {
  checkPrivatePlanningLoginLimit,
  getPrivatePlanningRateLimitIdentity,
  recordPrivatePlanningLoginFailure,
  recordPrivatePlanningLoginSuccess,
} from "@/lib/private-planning-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rateLimitTarget = "inner-circle-login";

function innerCircleLoginJson(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      ...innerCircleNoStoreHeaders,
      ...init?.headers,
    },
  });
}

function wait(delayMs: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

export async function POST(request: Request) {
  if (!isInnerCircleAuthConfigured()) {
    return innerCircleLoginJson({ ok: false, error: getInnerCircleMissingConfigMessage() }, { status: 500 });
  }

  if (!isSameOriginRequest(request)) {
    return innerCircleLoginJson({ ok: false, error: "Request origin could not be verified." }, { status: 403 });
  }

  const identity = getPrivatePlanningRateLimitIdentity(request);
  const rateLimit = await checkPrivatePlanningLoginLimit(identity, { target: rateLimitTarget }).catch((error) => {
    console.error("Inner Circle rate limit check failed.", error);
    return null;
  });

  if (!rateLimit) {
    return innerCircleLoginJson({ ok: false, error: "Inner Circle access is temporarily unavailable." }, { status: 503 });
  }

  if (!rateLimit.allowed) {
    return innerCircleLoginJson(
      { ok: false, error: "Too many attempts. Please wait a little before trying again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

  const body = (await request.json().catch(() => null)) as { passcode?: unknown } | null;
  const passcode = typeof body?.passcode === "string" ? body.passcode : "";

  if (!verifyInnerCirclePasscode(passcode)) {
    const failure = await recordPrivatePlanningLoginFailure(identity, { target: rateLimitTarget }).catch((error) => {
      console.error("Inner Circle rate limit update failed.", error);
      return null;
    });

    if (!failure) {
      return innerCircleLoginJson({ ok: false, error: "Inner Circle access is temporarily unavailable." }, { status: 503 });
    }

    console.warn("Inner Circle login failed.", {
      rateLimitKey: failure.logKey,
      failedAttempts: failure.failedAttempts,
      locked: failure.locked,
      limitedScopes: failure.limitedScopes,
    });

    if (failure.delayMs > 0) {
      await wait(failure.delayMs);
    }

    return innerCircleLoginJson(
      { ok: false, error: "That code didn't work. Please check it and try again." },
      {
        status: failure.locked ? 429 : 401,
        headers: failure.locked ? { "Retry-After": String(failure.retryAfterSeconds) } : undefined,
      },
    );
  }

  const token = createInnerCircleSessionToken();

  if (!token) {
    return innerCircleLoginJson({ ok: false, error: getInnerCircleMissingConfigMessage() }, { status: 500 });
  }

  await recordPrivatePlanningLoginSuccess(identity, { target: rateLimitTarget }).catch((error) => {
    console.error("Inner Circle rate limit reset failed.", error);
  });

  const response = innerCircleLoginJson({ ok: true });
  response.cookies.set(getInnerCircleCookieName(), token, getInnerCircleCookieOptions());

  for (const cookieName of INNER_CIRCLE_LEGACY_COOKIE_NAMES) {
    if (cookieName !== getInnerCircleCookieName()) {
      response.cookies.set(cookieName, "", getInnerCircleCookieOptions(0));
    }
  }

  return response;
}
