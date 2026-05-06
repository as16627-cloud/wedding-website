import { createHash, randomBytes } from "node:crypto";
import type { Prisma } from "@/app/generated/prisma/client";
import prisma from "@/lib/prisma";
import {
  getPrivatePlanningFileExtension,
  getPrivatePlanningMimeForExtension,
  PRIVATE_PLANNING_MAX_FILE_BYTES,
  privatePlanningAllowedMimeTypes,
} from "@/lib/private-planning-file-rules";

const STORAGE_PREFIX = "private-planning/files";
const SAFE_FILENAME_MAX_LENGTH = 120;
const SIGNATURE_BYTES_TO_READ = 16;

type SignatureValidationResult = {
  ok: boolean;
  mimeType?: string;
  error?: string;
};

export type PrivatePlanningFileTicketInput = {
  originalFilename: string;
  size: number;
  vendorId?: string;
  paymentId?: string;
};

export function isPrivatePlanningBlobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export function sanitizePrivatePlanningFilename(filename: string) {
  const lastSegment = filename.split(/[\\/]/).pop()?.trim() || "upload";
  const safeName = lastSegment
    .normalize("NFKD")
    .replace(/[^\w .()[\]-]+/g, "-")
    .replace(/\s+/g, " ")
    .replace(/\.+/g, ".")
    .replace(/^\.+/, "")
    .slice(0, SAFE_FILENAME_MAX_LENGTH)
    .trim();

  return safeName || "upload";
}

export function validatePrivatePlanningFileTicket(input: PrivatePlanningFileTicketInput) {
  const originalFilename = sanitizePrivatePlanningFilename(input.originalFilename);
  const extension = getPrivatePlanningFileExtension(originalFilename);
  const mimeType = getPrivatePlanningMimeForExtension(extension);

  if (!mimeType) {
    return {
      ok: false as const,
      error: "Only PDF, PNG, JPG, JPEG, and WebP files are allowed.",
    };
  }

  if (!Number.isInteger(input.size) || input.size <= 0 || input.size > PRIVATE_PLANNING_MAX_FILE_BYTES) {
    return {
      ok: false as const,
      error: "Files must be 10 MB or smaller.",
    };
  }

  return {
    ok: true as const,
    originalFilename,
    extension,
    mimeType,
    size: input.size,
    vendorId: typeof input.vendorId === "string" && input.vendorId.trim() ? input.vendorId.trim().slice(0, 128) : null,
    paymentId: typeof input.paymentId === "string" && input.paymentId.trim() ? input.paymentId.trim().slice(0, 128) : null,
  };
}

export function createPrivatePlanningStorageKey(fileId: string, extension: string) {
  return `${STORAGE_PREFIX}/${fileId}/${randomBytes(18).toString("hex")}.${extension}`;
}

function hashAuditValue(value?: string | null) {
  if (!value) {
    return null;
  }

  return createHash("sha256")
    .update(`${process.env.PRIVATE_PLANNING_SESSION_SECRET ?? "private-planning"}:${value}`)
    .digest("hex");
}

export async function createPrivatePlanningFileAuditLog(
  request: Request,
  action: string,
  fileId?: string | null,
  metadata?: Prisma.InputJsonObject,
) {
  const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip");

  await prisma.privatePlanningFileAuditLog.create({
    data: {
      fileId,
      action,
      ipHash: hashAuditValue(ipAddress),
      userAgent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
      metadata,
    },
  });
}

async function readStreamPrefix(stream: ReadableStream<Uint8Array>, byteCount = SIGNATURE_BYTES_TO_READ) {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (totalBytes < byteCount) {
      const result = await reader.read();

      if (result.done) {
        break;
      }

      chunks.push(result.value);
      totalBytes += result.value.length;
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }

  const prefix = new Uint8Array(Math.min(totalBytes, byteCount));
  let offset = 0;

  for (const chunk of chunks) {
    const nextLength = Math.min(chunk.length, prefix.length - offset);
    prefix.set(chunk.slice(0, nextLength), offset);
    offset += nextLength;

    if (offset >= prefix.length) {
      break;
    }
  }

  return prefix;
}

function ascii(bytes: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...bytes.slice(start, end));
}

function validateFileSignature(bytes: Uint8Array, expectedMimeType: string): SignatureValidationResult {
  if (expectedMimeType === "application/pdf") {
    return ascii(bytes, 0, 5) === "%PDF-"
      ? { ok: true, mimeType: expectedMimeType }
      : { ok: false, error: "PDF signature did not match." };
  }

  if (expectedMimeType === "image/png") {
    const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return pngSignature.every((value, index) => bytes[index] === value)
      ? { ok: true, mimeType: expectedMimeType }
      : { ok: false, error: "PNG signature did not match." };
  }

  if (expectedMimeType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      ? { ok: true, mimeType: expectedMimeType }
      : { ok: false, error: "JPEG signature did not match." };
  }

  if (expectedMimeType === "image/webp") {
    return ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP"
      ? { ok: true, mimeType: expectedMimeType }
      : { ok: false, error: "WebP signature did not match." };
  }

  return { ok: false, error: "Unsupported file signature." };
}

export async function validatePrivatePlanningBlobSignature(
  stream: ReadableStream<Uint8Array>,
  expectedMimeType: string,
) {
  if (!(privatePlanningAllowedMimeTypes as readonly string[]).includes(expectedMimeType)) {
    return { ok: false as const, error: "Unsupported file type." };
  }

  return validateFileSignature(await readStreamPrefix(stream), expectedMimeType);
}

export async function readPrivatePlanningBlobToBuffer(stream: ReadableStream<Uint8Array>, maxBytes = PRIVATE_PLANNING_MAX_FILE_BYTES) {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const result = await reader.read();

      if (result.done) {
        break;
      }

      totalBytes += result.value.length;

      if (totalBytes > maxBytes) {
        throw new Error("Stored file is larger than the extraction limit.");
      }

      chunks.push(result.value);
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }

  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
}

export function toPrivatePlanningFileDto(file: {
  id: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  vendorId: string | null;
  paymentId: string | null;
  scanStatus: string;
  uploadedAt: Date | null;
  createdAt: Date;
}, extra?: Record<string, unknown>) {
  return {
    id: file.id,
    originalFilename: file.originalFilename,
    mimeType: file.mimeType,
    size: file.size,
    vendorId: file.vendorId,
    paymentId: file.paymentId,
    scanStatus: file.scanStatus,
    uploadedAt: file.uploadedAt?.toISOString() ?? null,
    createdAt: file.createdAt.toISOString(),
    ...extra,
  };
}
