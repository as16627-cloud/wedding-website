import { NextResponse } from "next/server";
import {
  getPrivatePlanningCookieName,
  getPrivatePlanningCookieOptions,
  isSameOriginRequest,
  isPrivatePlanningAuthConfigured,
  PRIVATE_PLANNING_LEGACY_COOKIE_NAMES,
  privatePlanningNoStoreHeaders,
  verifyPrivatePlanningPasscode,
} from "@/lib/private-planning-auth";
import { createPrivatePlanningSession } from "@/lib/private-planning-session";
import {
  checkPrivatePlanningLoginLimit,
  getPrivatePlanningRateLimitIdentity,
  recordPrivatePlanningLoginFailure,
  recordPrivatePlanningLoginSuccess,
} from "@/lib/private-planning-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function privatePlanningJson(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      ...privatePlanningNoStoreHeaders,
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
  if (!isPrivatePlanningAuthConfigured()) {
    return privatePlanningJson(
      { ok: false, error: "Private planning access is not configured." },
      { status: 500 },
    );
  }

  if (!isSameOriginRequest(request)) {
    return privatePlanningJson({ ok: false, error: "Request origin could not be verified." }, { status: 403 });
  }

  const identity = getPrivatePlanningRateLimitIdentity(request);
  const rateLimit = await checkPrivatePlanningLoginLimit(identity).catch((error) => {
    console.error("Private planning rate limit check failed.", error);
    return null;
  });

  if (!rateLimit) {
    return privatePlanningJson(
      { ok: false, error: "Private planning access is temporarily unavailable." },
      { status: 503 },
    );
  }

  if (!rateLimit.allowed) {
    return privatePlanningJson(
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

  if (!verifyPrivatePlanningPasscode(passcode)) {
    const failure = await recordPrivatePlanningLoginFailure(identity).catch((error) => {
      console.error("Private planning rate limit update failed.", error);
      return null;
    });

    if (!failure) {
      return privatePlanningJson(
        { ok: false, error: "Private planning access is temporarily unavailable." },
        { status: 503 },
      );
    }

    console.warn("Private planning login failed.", {
      rateLimitKey: failure.logKey,
      failedAttempts: failure.failedAttempts,
      locked: failure.locked,
      limitedScopes: failure.limitedScopes,
    });

    if (failure.delayMs > 0) {
      await wait(failure.delayMs);
    }

    return privatePlanningJson(
      { ok: false, error: "That passcode does not look quite right." },
      {
        status: failure.locked ? 429 : 401,
        headers: failure.locked ? { "Retry-After": String(failure.retryAfterSeconds) } : undefined,
      },
    );
  }

  const token = await createPrivatePlanningSession().catch((error) => {
    console.error("Private planning session creation failed.", error);
    return null;
  });

  if (!token) {
    return privatePlanningJson(
      { ok: false, error: "Private planning access is not configured." },
      { status: 500 },
    );
  }

  await recordPrivatePlanningLoginSuccess(identity).catch((error) => {
    console.error("Private planning rate limit reset failed.", error);
  });

  const response = privatePlanningJson({ ok: true });
  response.cookies.set(getPrivatePlanningCookieName(), token, getPrivatePlanningCookieOptions());

  for (const cookieName of PRIVATE_PLANNING_LEGACY_COOKIE_NAMES) {
    if (cookieName !== getPrivatePlanningCookieName()) {
      response.cookies.set(cookieName, "", getPrivatePlanningCookieOptions(0));
    }
  }

  return response;
}
