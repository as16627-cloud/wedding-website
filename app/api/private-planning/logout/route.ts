import { NextRequest, NextResponse } from "next/server";
import {
  getPrivatePlanningCookieName,
  getPrivatePlanningCookieOptions,
  isSameOriginRequest,
  PRIVATE_PLANNING_LEGACY_COOKIE_NAMES,
  privatePlanningNoStoreHeaders,
  readPrivatePlanningSessionToken,
} from "@/lib/private-planning-auth";
import { revokePrivatePlanningSession } from "@/lib/private-planning-session";

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

function clearPrivatePlanningCookies(response: NextResponse) {
  const cookieNames = new Set([getPrivatePlanningCookieName(), ...PRIVATE_PLANNING_LEGACY_COOKIE_NAMES]);

  for (const cookieName of cookieNames) {
    response.cookies.set(cookieName, "", getPrivatePlanningCookieOptions(0));
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return privatePlanningJson({ ok: false, error: "Request origin could not be verified." }, { status: 403 });
  }

  const response = privatePlanningJson({ ok: true });
  await revokePrivatePlanningSession(readPrivatePlanningSessionToken(request.cookies)).catch((error) => {
    console.error("Private planning session revoke failed.", error);
  });
  clearPrivatePlanningCookies(response);

  return response;
}
