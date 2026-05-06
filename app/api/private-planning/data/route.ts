import { type Prisma } from "@/app/generated/prisma/client";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  MAX_PRIVATE_PLANNING_PAYLOAD_BYTES,
  PRIVATE_PLANNING_DATA_ID,
  savePrivatePlanningDataPayload,
} from "@/lib/private-planning-data";
import { withDefaultPrivatePlanningRunsheet } from "@/lib/private-planning-runsheet-seed";
import {
  hasPrivatePlanningCsrfHeader,
  isPrivatePlanningAuthConfigured,
  isSameOriginRequest,
  privatePlanningNoStoreHeaders,
  readPrivatePlanningSessionToken,
} from "@/lib/private-planning-auth";
import { verifyPrivatePlanningSession } from "@/lib/private-planning-session";

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

async function isAuthenticatedPrivatePlanningRequest(request: NextRequest) {
  return verifyPrivatePlanningSession(readPrivatePlanningSessionToken(request.cookies)).catch((error) => {
    console.error("Private planning session check failed.", error);
    return false;
  });
}

function validateStateChangingRequest(request: NextRequest) {
  return isSameOriginRequest(request) && hasPrivatePlanningCsrfHeader(request);
}

async function parsePlanningPayload(request: NextRequest) {
  const rawBody = await request.text();

  if (Buffer.byteLength(rawBody, "utf8") > MAX_PRIVATE_PLANNING_PAYLOAD_BYTES) {
    return { ok: false as const, error: "Planning data is too large." };
  }

  const parsed = JSON.parse(rawBody) as unknown;

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false as const, error: "Planning data must be an object." };
  }

  return { ok: true as const, payload: parsed as Prisma.InputJsonObject };
}

export async function GET(request: NextRequest) {
  if (!isPrivatePlanningAuthConfigured()) {
    return privatePlanningJson({ ok: false, error: "Private planning access is not configured." }, { status: 500 });
  }

  if (!(await isAuthenticatedPrivatePlanningRequest(request))) {
    return privatePlanningJson({ ok: false, error: "Private planning access is required." }, { status: 401 });
  }

  try {
    const record = await prisma.privatePlanningData.findUnique({
      where: { id: PRIVATE_PLANNING_DATA_ID },
    });

    return privatePlanningJson({
      ok: true,
      hasData: Boolean(record),
      data: withDefaultPrivatePlanningRunsheet(record?.payload ?? null),
      updatedAt: record?.updatedAt?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("Private planning data load failed.", error);
    return privatePlanningJson({ ok: false, error: "Could not load private planning data." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!isPrivatePlanningAuthConfigured()) {
    return privatePlanningJson({ ok: false, error: "Private planning access is not configured." }, { status: 500 });
  }

  if (!(await isAuthenticatedPrivatePlanningRequest(request))) {
    return privatePlanningJson({ ok: false, error: "Private planning access is required." }, { status: 401 });
  }

  if (!validateStateChangingRequest(request)) {
    return privatePlanningJson({ ok: false, error: "Request origin could not be verified." }, { status: 403 });
  }

  try {
    const parsed = await parsePlanningPayload(request);

    if (!parsed.ok) {
      return privatePlanningJson({ ok: false, error: parsed.error }, { status: 400 });
    }

    const record = await savePrivatePlanningDataPayload(parsed.payload);

    return privatePlanningJson({ ok: true, updatedAt: record.updatedAt.toISOString() });
  } catch (error) {
    console.error("Private planning data save failed.", error);
    return privatePlanningJson({ ok: false, error: "Could not save private planning data." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isPrivatePlanningAuthConfigured()) {
    return privatePlanningJson({ ok: false, error: "Private planning access is not configured." }, { status: 500 });
  }

  if (!(await isAuthenticatedPrivatePlanningRequest(request))) {
    return privatePlanningJson({ ok: false, error: "Private planning access is required." }, { status: 401 });
  }

  if (!validateStateChangingRequest(request)) {
    return privatePlanningJson({ ok: false, error: "Request origin could not be verified." }, { status: 403 });
  }

  try {
    await prisma.privatePlanningData.deleteMany({
      where: { id: PRIVATE_PLANNING_DATA_ID },
    });

    return privatePlanningJson({ ok: true });
  } catch (error) {
    console.error("Private planning data delete failed.", error);
    return privatePlanningJson({ ok: false, error: "Could not delete private planning data." }, { status: 500 });
  }
}
