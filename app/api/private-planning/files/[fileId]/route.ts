import { del } from "@vercel/blob";
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
  isPrivatePlanningBlobConfigured,
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
    console.error("Private planning file delete session check failed.", error);
    return false;
  });
}

function validateStateChangingRequest(request: NextRequest) {
  return isSameOriginRequest(request) && hasPrivatePlanningCsrfHeader(request);
}

export async function DELETE(request: NextRequest, context: RouteContext<"/api/private-planning/files/[fileId]">) {
  if (!isPrivatePlanningAuthConfigured()) {
    return privatePlanningJson({ ok: false, error: "Private planning access is not configured." }, { status: 500 });
  }

  if (!(await isAuthenticatedPrivatePlanningRequest(request))) {
    return privatePlanningJson({ ok: false, error: "Private planning access is required." }, { status: 401 });
  }

  if (!validateStateChangingRequest(request)) {
    return privatePlanningJson({ ok: false, error: "Request origin could not be verified." }, { status: 403 });
  }

  if (!isPrivatePlanningBlobConfigured()) {
    return privatePlanningJson({ ok: false, error: "Private file storage is not configured yet." }, { status: 503 });
  }

  const { fileId } = await context.params;
  const file = await prisma.privatePlanningFile.findUnique({
    where: { id: fileId },
  });

  if (!file) {
    return privatePlanningJson({ ok: false, error: "File not found." }, { status: 404 });
  }

  await del(file.storageKey);
  await createPrivatePlanningFileAuditLog(request, "delete", file.id, {
    mimeType: file.mimeType,
    size: file.size,
    status: file.status,
  });
  await prisma.privatePlanningVendorSuggestion.deleteMany({
    where: { fileId: file.id },
  });
  await prisma.privatePlanningFileExtraction.deleteMany({
    where: { fileId: file.id },
  });
  await prisma.privatePlanningFile.delete({
    where: { id: file.id },
  });

  return privatePlanningJson({ ok: true });
}

export async function PATCH(request: NextRequest, context: RouteContext<"/api/private-planning/files/[fileId]">) {
  if (!isPrivatePlanningAuthConfigured()) {
    return privatePlanningJson({ ok: false, error: "Private planning access is not configured." }, { status: 500 });
  }

  if (!(await isAuthenticatedPrivatePlanningRequest(request))) {
    return privatePlanningJson({ ok: false, error: "Private planning access is required." }, { status: 401 });
  }

  if (!validateStateChangingRequest(request)) {
    return privatePlanningJson({ ok: false, error: "Request origin could not be verified." }, { status: 403 });
  }

  const { fileId } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    vendorId?: unknown;
    paymentId?: unknown;
  } | null;
  const vendorId = typeof body?.vendorId === "string" && body.vendorId.trim() ? body.vendorId.trim() : null;
  const paymentId = typeof body?.paymentId === "string" && body.paymentId.trim() ? body.paymentId.trim() : null;
  const file = await prisma.privatePlanningFile.findUnique({
    where: { id: fileId },
  });

  if (!file) {
    return privatePlanningJson({ ok: false, error: "File not found." }, { status: 404 });
  }

  const updatedFile = await prisma.privatePlanningFile.update({
    where: { id: file.id },
    data: {
      vendorId,
      paymentId,
    },
    select: {
      id: true,
      vendorId: true,
      paymentId: true,
    },
  });

  await createPrivatePlanningFileAuditLog(request, "metadata_update", file.id, {
    vendorId,
    paymentId,
  });

  return privatePlanningJson({ ok: true, file: updatedFile });
}
