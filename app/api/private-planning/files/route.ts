import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  hasPrivatePlanningCsrfHeader,
  isPrivatePlanningAuthConfigured,
  isSameOriginRequest,
  privatePlanningNoStoreHeaders,
  readPrivatePlanningSessionToken,
} from "@/lib/private-planning-auth";
import {
  createPrivatePlanningFileAuditLog,
  createPrivatePlanningStorageKey,
  isPrivatePlanningBlobConfigured,
  toPrivatePlanningFileDto,
  validatePrivatePlanningFileTicket,
} from "@/lib/private-planning-files";
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
    console.error("Private planning file session check failed.", error);
    return false;
  });
}

function validateStateChangingRequest(request: NextRequest) {
  return isSameOriginRequest(request) && hasPrivatePlanningCsrfHeader(request);
}

export async function GET(request: NextRequest) {
  if (!isPrivatePlanningAuthConfigured()) {
    return privatePlanningJson({ ok: false, error: "Private planning access is not configured." }, { status: 500 });
  }

  if (!(await isAuthenticatedPrivatePlanningRequest(request))) {
    return privatePlanningJson({ ok: false, error: "Private planning access is required." }, { status: 401 });
  }

  const files = await prisma.privatePlanningFile.findMany({
    where: { status: "ready" },
    orderBy: [{ uploadedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      originalFilename: true,
      mimeType: true,
      size: true,
      vendorId: true,
      paymentId: true,
      scanStatus: true,
      uploadedAt: true,
      createdAt: true,
    },
  });

  return privatePlanningJson({
    ok: true,
    files: files.map(toPrivatePlanningFileDto),
    storageConfigured: isPrivatePlanningBlobConfigured(),
  });
}

export async function POST(request: NextRequest) {
  if (!isPrivatePlanningAuthConfigured()) {
    return privatePlanningJson({ ok: false, error: "Private planning access is not configured." }, { status: 500 });
  }

  if (!(await isAuthenticatedPrivatePlanningRequest(request))) {
    return privatePlanningJson({ ok: false, error: "Private planning access is required." }, { status: 401 });
  }

  if (!validateStateChangingRequest(request)) {
    return privatePlanningJson({ ok: false, error: "Request origin could not be verified." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    originalFilename?: unknown;
    size?: unknown;
    vendorId?: unknown;
    paymentId?: unknown;
  } | null;
  const validation = validatePrivatePlanningFileTicket({
    originalFilename: typeof body?.originalFilename === "string" ? body.originalFilename : "",
    size: typeof body?.size === "number" ? body.size : 0,
    vendorId: typeof body?.vendorId === "string" ? body.vendorId : undefined,
    paymentId: typeof body?.paymentId === "string" ? body.paymentId : undefined,
  });

  if (!validation.ok) {
    return privatePlanningJson({ ok: false, error: validation.error }, { status: 400 });
  }

  if (!isPrivatePlanningBlobConfigured()) {
    return privatePlanningJson(
      { ok: false, error: "Private file storage is not configured yet." },
      { status: 503 },
    );
  }

  const fileId = randomUUID();
  const storageKey = createPrivatePlanningStorageKey(fileId, validation.extension);
  const updatedFile = await prisma.privatePlanningFile.create({
    data: {
      id: fileId,
      originalFilename: validation.originalFilename,
      storageKey,
      mimeType: validation.mimeType,
      size: validation.size,
      vendorId: validation.vendorId,
      paymentId: validation.paymentId,
      status: "pending",
      scanStatus: "unscanned",
    },
  });

  await createPrivatePlanningFileAuditLog(request, "upload_ticket", updatedFile.id, {
    mimeType: updatedFile.mimeType,
    size: updatedFile.size,
    vendorId: updatedFile.vendorId,
  });

  return privatePlanningJson({
    ok: true,
    ticket: {
      id: updatedFile.id,
      storageKey: updatedFile.storageKey,
      mimeType: updatedFile.mimeType,
      maxSize: updatedFile.size,
    },
  });
}
