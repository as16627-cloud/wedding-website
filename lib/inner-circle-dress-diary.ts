export const INNER_CIRCLE_DRESS_DIARY_KEY = "innerCircleDressDiaryPhotos";

export type InnerCircleDressDiaryPhotoRecord = {
  id: string;
  fileId: string;
  alt: string;
  caption: string;
  date: string;
  tag: string;
  order: number;
  visible: boolean;
};

const MAX_DRESS_DIARY_PHOTOS = 48;

function cleanString(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function cleanOrder(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return Math.trunc(parsed);
    }
  }

  return fallback;
}

export function normalizeInnerCircleDressDiaryPhotos(value: unknown): InnerCircleDressDiaryPhotoRecord[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .slice(0, MAX_DRESS_DIARY_PHOTOS)
    .map((item, index): InnerCircleDressDiaryPhotoRecord | null => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }

      const record = item as Record<string, unknown>;
      const id = cleanString(record.id, 120);
      const fileId = cleanString(record.fileId, 120);

      if (!id || !fileId) {
        return null;
      }

      return {
        id,
        fileId,
        alt: cleanString(record.alt, 220),
        caption: cleanString(record.caption, 180),
        date: cleanString(record.date, 40),
        tag: cleanString(record.tag, 60),
        order: cleanOrder(record.order, index + 1),
        visible: record.visible !== false,
      };
    })
    .filter((item): item is InnerCircleDressDiaryPhotoRecord => Boolean(item))
    .sort((first, second) => first.order - second.order || first.caption.localeCompare(second.caption));
}
