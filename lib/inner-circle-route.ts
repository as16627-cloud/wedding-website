import { NextRequest, NextResponse } from "next/server";
import {
  hasInnerCircleCsrfHeader,
  innerCircleNoStoreHeaders,
  isInnerCircleAuthConfigured,
  readInnerCircleSessionToken,
  verifyInnerCircleSessionToken,
} from "@/lib/inner-circle-auth";
import { isSameOriginRequest } from "@/lib/private-planning-auth";

export function innerCircleJson(body: unknown, init?: ResponseInit) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      ...innerCircleNoStoreHeaders,
      ...init?.headers,
    },
  });
}

export function verifyInnerCircleApiRequest(request: NextRequest) {
  if (!verifyInnerCircleSessionToken(readInnerCircleSessionToken(request.cookies))) {
    return { ok: false as const, response: innerCircleJson({ ok: false, error: "Inner Circle access is required." }, { status: 401 }) };
  }

  if (!isInnerCircleAuthConfigured()) {
    return { ok: false as const, response: innerCircleJson({ ok: false, error: "Inner Circle access is not configured." }, { status: 500 }) };
  }

  return { ok: true as const };
}

export function verifyInnerCircleMutationRequest(request: NextRequest) {
  if (isSameOriginRequest(request) && hasInnerCircleCsrfHeader(request)) {
    return { ok: true as const };
  }

  return { ok: false as const, response: innerCircleJson({ ok: false, error: "Request origin could not be verified." }, { status: 403 }) };
}
