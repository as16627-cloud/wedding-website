import { NextRequest } from "next/server";
import { innerCircleJson, verifyInnerCircleApiRequest } from "@/lib/inner-circle-route";
import {
  INNER_CIRCLE_DRESS_DIARY_KEY,
  normalizeInnerCircleDressDiaryPhotos,
} from "@/lib/inner-circle-dress-diary";
import { readPrivatePlanningDataPayload } from "@/lib/private-planning-data";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const access = verifyInnerCircleApiRequest(request);

  if (!access.ok) {
    return access.response;
  }

  const { payload } = await readPrivatePlanningDataPayload();
  const photos = normalizeInnerCircleDressDiaryPhotos(payload[INNER_CIRCLE_DRESS_DIARY_KEY])
    .filter((photo) => photo.visible);
  const fileIds = Array.from(new Set(photos.map((photo) => photo.fileId)));
  const files = fileIds.length > 0
    ? await prisma.privatePlanningFile.findMany({
        where: {
          id: { in: fileIds },
          status: "ready",
          mimeType: { startsWith: "image/" },
        },
        select: {
          id: true,
          uploadedAt: true,
        },
      })
    : [];
  const readyFiles = new Map(files.map((file) => [file.id, file]));

  return innerCircleJson({
    ok: true,
    photos: photos
      .filter((photo) => readyFiles.has(photo.fileId))
      .map((photo) => ({
        id: photo.id,
        alt: photo.alt || photo.caption || "Private dress diary photo",
        caption: photo.caption,
        date: photo.date,
        tag: photo.tag,
        thumbnailSrc: `/api/inner-circle/photos/${encodeURIComponent(photo.id)}/image?variant=thumb`,
        src: `/api/inner-circle/photos/${encodeURIComponent(photo.id)}/image`,
        uploadedAt: readyFiles.get(photo.fileId)?.uploadedAt?.toISOString() ?? null,
      })),
    emptyMessage: "We'll add a few private dress-trial moments here once we're ready to share them with you.",
  });
}
