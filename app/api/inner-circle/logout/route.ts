import { NextRequest, NextResponse } from "next/server";
import {
  getInnerCircleCookieName,
  getInnerCircleCookieOptions,
  INNER_CIRCLE_LEGACY_COOKIE_NAMES,
  innerCircleNoStoreHeaders,
} from "@/lib/inner-circle-auth";
import { isSameOriginRequest } from "@/lib/private-planning-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function innerCircleLogoutJson(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      ...innerCircleNoStoreHeaders,
      ...init?.headers,
    },
  });
}

function clearInnerCircleCookies(response: NextResponse) {
  const cookieNames = new Set([getInnerCircleCookieName(), ...INNER_CIRCLE_LEGACY_COOKIE_NAMES]);

  for (const cookieName of cookieNames) {
    response.cookies.set(cookieName, "", getInnerCircleCookieOptions(0));
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return innerCircleLogoutJson({ ok: false, error: "Request origin could not be verified." }, { status: 403 });
  }

  const response = innerCircleLogoutJson({ ok: true });
  clearInnerCircleCookies(response);

  return response;
}
