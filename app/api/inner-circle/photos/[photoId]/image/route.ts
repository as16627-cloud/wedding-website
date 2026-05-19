import { get } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { innerCircleJson, verifyInnerCircleApiRequest } from "@/lib/inner-circle-route";
import {
  INNER_CIRCLE_DRESS_DIARY_KEY,
  normalizeInnerCircleDressDiaryPhotos,
} from "@/lib/inner-circle-dress-diary";
import { readPrivatePlanningDataPayload } from "@/lib/private-planning-data";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function inlineFilename(photoId: string) {
  return `inline; filename=\"dress-diary-${photoId.replace(/[^a-zA-Z0-9_-]+/g, "-")}.jpg\"`;
}

export async function GET(
  request: NextRequest,
  context: RouteContext<"/api/inner-circle/photos/[photoId]/image">,
) {
  const access = verifyInnerCircleApiRequest(request);

  if (!access.ok) {
    return access.response;
  }

  const { photoId } = await context.params;
  const { payload } = await readPrivatePlanningDataPayload();
  const photo = normalizeInnerCircleDressDiaryPhotos(payload[INNER_CIRCLE_DRESS_DIARY_KEY])
    .find((item) => item.visible && item.id === photoId);

  if (!photo) {
    return innerCircleJson({ ok: false, error: "Dress diary photo not found." }, { status: 404 });
  }

  const file = await prisma.privatePlanningFile.findFirst({
    where: {
      id: photo.fileId,
      status: "ready",
      mimeType: { startsWith: "image/" },
    },
    select: {
      id: true,
      storageKey: true,
      mimeType: true,
    },
  });

  if (!file) {
    return innerCircleJson({ ok: false, error: "Dress diary photo not found." }, { status: 404 });
  }

  const result = await get(file.storageKey, { access: "private", useCache: false });

  if (!result || result.statusCode !== 200) {
    return innerCircleJson({ ok: false, error: "Dress diary photo could not be loaded." }, { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": file.mimeType,
      "Content-Disposition": inlineFilename(photo.id),
      "Content-Length": String(result.blob.size),
      "X-Content-Type-Options": "nosniff",
    },
  });
}
