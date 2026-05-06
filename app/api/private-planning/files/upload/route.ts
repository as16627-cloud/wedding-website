import { del, get } from "@vercel/blob";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
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
  validatePrivatePlanningBlobSignature,
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
    console.error("Private planning file upload session check failed.", error);
    return false;
  });
}

function parseTokenPayload(tokenPayload?: string | null) {
  const parsed = tokenPayload ? (JSON.parse(tokenPayload) as { fileId?: unknown; storageKey?: unknown }) : {};

  return {
    fileId: typeof parsed.fileId === "string" ? parsed.fileId : "",
    storageKey: typeof parsed.storageKey === "string" ? parsed.storageKey : "",
  };
}

async function rejectBlobUpload(request: Request, fileId: string, storageKey: string, reason: string) {
  await del(storageKey).catch(() => undefined);
  await prisma.privatePlanningFile.updateMany({
    where: { id: fileId },
    data: {
      status: "rejected",
      scanStatus: "rejected",
    },
  });
  await createPrivatePlanningFileAuditLog(request, "upload_rejected", fileId, { reason });
}

export async function POST(request: NextRequest) {
  if (!isPrivatePlanningAuthConfigured()) {
    return privatePlanningJson({ ok: false, error: "Private planning access is not configured." }, { status: 500 });
  }

  const body = (await request.json().catch(() => null)) as HandleUploadBody | null;

  if (!body) {
    return privatePlanningJson({ ok: false, error: "Invalid upload request." }, { status: 400 });
  }

  if (body.type === "blob.generate-client-token" && !(await isAuthenticatedPrivatePlanningRequest(request))) {
    return privatePlanningJson({ ok: false, error: "Private planning access is required." }, { status: 401 });
  }

  if (body.type === "blob.generate-client-token" && (!isSameOriginRequest(request) || !hasPrivatePlanningCsrfHeader(request))) {
    return privatePlanningJson({ ok: false, error: "Request origin could not be verified." }, { status: 403 });
  }

  if (!isPrivatePlanningBlobConfigured()) {
    return privatePlanningJson({ ok: false, error: "Private file storage is not configured yet." }, { status: 503 });
  }

  try {
    const uploadResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!(await isAuthenticatedPrivatePlanningRequest(request))) {
          throw new Error("Private planning access is required.");
        }

        if (!isSameOriginRequest(request) || !hasPrivatePlanningCsrfHeader(request)) {
          throw new Error("Request origin could not be verified.");
        }

        const { fileId } = parseTokenPayload(clientPayload);
        const file = await prisma.privatePlanningFile.findUnique({
          where: { id: fileId },
          select: {
            id: true,
            storageKey: true,
            mimeType: true,
            size: true,
            status: true,
          },
        });

        if (!file || file.status !== "pending" || file.storageKey !== pathname) {
          throw new Error("Upload ticket is not valid.");
        }

        return {
          allowedContentTypes: [file.mimeType],
          maximumSizeInBytes: file.size,
          validUntil: Date.now() + 10 * 60 * 1000,
          addRandomSuffix: false,
          allowOverwrite: false,
          cacheControlMaxAge: 60,
          tokenPayload: JSON.stringify({
            fileId: file.id,
            storageKey: file.storageKey,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const { fileId, storageKey } = parseTokenPayload(tokenPayload);
        const file = await prisma.privatePlanningFile.findUnique({
          where: { id: fileId },
        });

        if (!file || file.status !== "pending" || file.storageKey !== storageKey || blob.pathname !== storageKey) {
          await rejectBlobUpload(request, fileId, blob.pathname, "Upload ticket mismatch.");
          return;
        }

        const result = await get(storageKey, { access: "private", useCache: false });

        if (!result || result.statusCode !== 200) {
          await rejectBlobUpload(request, file.id, storageKey, "Uploaded blob could not be read.");
          return;
        }

        if (result.blob.size !== file.size || result.blob.contentType !== file.mimeType) {
          await rejectBlobUpload(request, file.id, storageKey, "Uploaded blob metadata did not match the ticket.");
          return;
        }

        const signature = await validatePrivatePlanningBlobSignature(result.stream, file.mimeType);

        if (!signature.ok) {
          await rejectBlobUpload(request, file.id, storageKey, signature.error ?? "File signature did not match.");
          return;
        }

        await prisma.privatePlanningFile.update({
          where: { id: file.id },
          data: {
            mimeType: signature.mimeType ?? file.mimeType,
            size: result.blob.size,
            status: "ready",
            scanStatus: "unscanned",
            uploadedAt: new Date(),
          },
        });
        await createPrivatePlanningFileAuditLog(request, "upload_completed", file.id, {
          mimeType: file.mimeType,
          size: result.blob.size,
          scanStatus: "unscanned",
        });
      },
    });

    return privatePlanningJson(uploadResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload could not be prepared.";
    return privatePlanningJson({ ok: false, error: message }, { status: 400 });
  }
}
