import { get } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  isPrivatePlanningAuthConfigured,
  privatePlanningNoStoreHeaders,
  readPrivatePlanningSessionToken,
} from "@/lib/private-planning-auth";
import {
  createPrivatePlanningFileAuditLog,
  isPrivatePlanningBlobConfigured,
  sanitizePrivatePlanningFilename,
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
    console.error("Private planning file download session check failed.", error);
    return false;
  });
}

function contentDispositionAttachment(filename: string) {
  const safeFilename = sanitizePrivatePlanningFilename(filename).replace(/["\\]/g, "-");

  return `attachment; filename="${safeFilename}"`;
}

export async function GET(
  request: NextRequest,
  context: RouteContext<"/api/private-planning/files/[fileId]/download">,
) {
  if (!isPrivatePlanningAuthConfigured()) {
    return privatePlanningJson({ ok: false, error: "Private planning access is not configured." }, { status: 500 });
  }

  if (!(await isAuthenticatedPrivatePlanningRequest(request))) {
    return privatePlanningJson({ ok: false, error: "Private planning access is required." }, { status: 401 });
  }

  if (!isPrivatePlanningBlobConfigured()) {
    return privatePlanningJson({ ok: false, error: "Private file storage is not configured yet." }, { status: 503 });
  }

  const { fileId } = await context.params;
  const file = await prisma.privatePlanningFile.findFirst({
    where: {
      id: fileId,
      status: "ready",
    },
  });

  if (!file) {
    return privatePlanningJson({ ok: false, error: "File not found." }, { status: 404 });
  }

  const result = await get(file.storageKey, { access: "private", useCache: false });

  if (!result || result.statusCode !== 200) {
    return privatePlanningJson({ ok: false, error: "Stored file could not be read." }, { status: 404 });
  }

  await createPrivatePlanningFileAuditLog(request, "download", file.id, {
    mimeType: file.mimeType,
    size: file.size,
  });

  return new NextResponse(result.stream, {
    headers: {
      ...privatePlanningNoStoreHeaders,
      "Content-Type": file.mimeType,
      "Content-Disposition": contentDispositionAttachment(file.originalFilename),
      "Content-Length": String(result.blob.size),
      "X-Content-Type-Options": "nosniff",
    },
  });
}
