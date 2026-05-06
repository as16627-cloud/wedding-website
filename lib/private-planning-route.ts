import { NextRequest, NextResponse } from "next/server";
import {
  hasPrivatePlanningCsrfHeader,
  isPrivatePlanningAuthConfigured,
  isSameOriginRequest,
  privatePlanningNoStoreHeaders,
  readPrivatePlanningSessionToken,
} from "@/lib/private-planning-auth";
import { verifyPrivatePlanningSession } from "@/lib/private-planning-session";

export function privatePlanningJson(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      ...privatePlanningNoStoreHeaders,
      ...init?.headers,
    },
  });
}

export async function verifyPrivatePlanningApiRequest(request: NextRequest, logLabel: string) {
  if (!isPrivatePlanningAuthConfigured()) {
    return { ok: false as const, response: privatePlanningJson({ ok: false, error: "Private planning access is not configured." }, { status: 500 }) };
  }

  const authenticated = await verifyPrivatePlanningSession(readPrivatePlanningSessionToken(request.cookies)).catch((error) => {
    console.error(`${logLabel} session check failed.`, error);
    return false;
  });

  if (!authenticated) {
    return { ok: false as const, response: privatePlanningJson({ ok: false, error: "Private planning access is required." }, { status: 401 }) };
  }

  return { ok: true as const };
}

export function verifyPrivatePlanningMutationRequest(request: NextRequest) {
  if (isSameOriginRequest(request) && hasPrivatePlanningCsrfHeader(request)) {
    return { ok: true as const };
  }

  return { ok: false as const, response: privatePlanningJson({ ok: false, error: "Request origin could not be verified." }, { status: 403 }) };
}
