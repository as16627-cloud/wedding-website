export const PRIVATE_PLANNING_MAX_FILE_BYTES = 10 * 1024 * 1024;

export const privatePlanningAllowedFileTypes = [
  {
    extension: "pdf",
    mimeType: "application/pdf",
    label: "PDF",
  },
  {
    extension: "png",
    mimeType: "image/png",
    label: "PNG",
  },
  {
    extension: "jpg",
    mimeType: "image/jpeg",
    label: "JPG",
  },
  {
    extension: "jpeg",
    mimeType: "image/jpeg",
    label: "JPEG",
  },
  {
    extension: "webp",
    mimeType: "image/webp",
    label: "WebP",
  },
] as const;

export const privatePlanningAllowedMimeTypes = Array.from(
  new Set(privatePlanningAllowedFileTypes.map((fileType) => fileType.mimeType)),
);

export function getPrivatePlanningFileExtension(filename: string) {
  const lastSegment = filename.split(/[\\/]/).pop() ?? "";
  const extension = lastSegment.includes(".") ? lastSegment.split(".").pop()?.toLowerCase() ?? "" : "";

  return extension;
}

export function getPrivatePlanningMimeForExtension(extension: string) {
  return privatePlanningAllowedFileTypes.find((fileType) => fileType.extension === extension.toLowerCase())?.mimeType;
}

export function formatPrivatePlanningFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
