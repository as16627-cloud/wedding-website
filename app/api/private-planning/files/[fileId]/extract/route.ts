import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { readPrivatePlanningDataPayload } from "@/lib/private-planning-data";
import {
  createPrivatePlanningFileAuditLog,
} from "@/lib/private-planning-files";
import {
  canExtractPrivatePlanningMimeType,
  extractPrivatePlanningDetailsFromText,
  findPrivatePlanningVendorMatches,
  PRIVATE_PLANNING_EXTRACTION_SOURCE,
  toPrivatePlanningFileExtractionDto,
  type PrivatePlanningVendorRecord,
} from "@/lib/private-planning-vendor-extraction";
import {
  privatePlanningJson,
  verifyPrivatePlanningApiRequest,
  verifyPrivatePlanningMutationRequest,
} from "@/lib/private-planning-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getPlanningVendors(value: unknown): PrivatePlanningVendorRecord[] {
  return Array.isArray(value) ? value.filter((vendor): vendor is PrivatePlanningVendorRecord => Boolean(vendor && typeof vendor === "object")) : [];
}

function getExtractionFailureMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Extraction failed.";

  if (/no readable text/i.test(message)) {
    return "No readable text found — download only";
  }

  return "Could not extract details from this file. Please try again or enter the vendor manually.";
}

export async function POST(
  request: NextRequest,
  context: RouteContext<"/api/private-planning/files/[fileId]/extract">,
) {
  const { fileId } = await context.params;
  const auth = await verifyPrivatePlanningApiRequest(request, "Private planning file extraction");

  if (!auth.ok) {
    await createPrivatePlanningFileAuditLog(request, "extraction_access_denied", fileId, { status: auth.response.status });
    return auth.response;
  }

  const mutation = verifyPrivatePlanningMutationRequest(request);

  if (!mutation.ok) {
    await createPrivatePlanningFileAuditLog(request, "extraction_access_denied", fileId, { status: mutation.response.status });
    return mutation.response;
  }

  const body = (await request.json().catch(() => null)) as {
    force?: unknown;
    extractedText?: unknown;
    extractionMethod?: unknown;
  } | null;
  const force = body?.force === true;
  const extractedText = typeof body?.extractedText === "string" ? body.extractedText : "";
  const extractionMethod = typeof body?.extractionMethod === "string" ? body.extractionMethod.trim().slice(0, 80) : "local-text";

  const existingExtraction = await prisma.privatePlanningFileExtraction.findUnique({
    where: { fileId },
  });
  const existingSuggestion = await prisma.privatePlanningVendorSuggestion.findFirst({
    where: { fileId },
    orderBy: { createdAt: "desc" },
  });

  if (existingExtraction && existingSuggestion && !force) {
    if (["review_needed", "applied", "linked", "dismissed"].includes(existingSuggestion.suggestionStatus)) {
      return privatePlanningJson({
        ok: true,
        extraction: toPrivatePlanningFileExtractionDto(existingExtraction, existingSuggestion),
      });
    }
  }

  const file = await prisma.privatePlanningFile.findFirst({
    where: {
      id: fileId,
      status: "ready",
    },
  });

  if (!file) {
    await createPrivatePlanningFileAuditLog(request, "extraction_failed", fileId, { reason: "file not found" });
    return privatePlanningJson({ ok: false, error: "File not found." }, { status: 404 });
  }

  if (!canExtractPrivatePlanningMimeType(file.mimeType)) {
    await createPrivatePlanningFileAuditLog(request, "extraction_failed", file.id, { reason: "unsupported MIME type", mimeType: file.mimeType });
    return privatePlanningJson({ ok: false, error: "This file type cannot be extracted." }, { status: 400 });
  }

  await createPrivatePlanningFileAuditLog(request, "extraction_started", file.id, {
    mimeType: file.mimeType,
    size: file.size,
    force,
    method: extractionMethod,
    textLength: extractedText.length,
  });

  const extraction = await prisma.privatePlanningFileExtraction.upsert({
    where: { fileId: file.id },
    create: {
      fileId: file.id,
      extractionStatus: "extracting",
      sourceModel: PRIVATE_PLANNING_EXTRACTION_SOURCE,
    },
    update: {
      extractionStatus: "extracting",
      errorMessage: null,
      sourceModel: PRIVATE_PLANNING_EXTRACTION_SOURCE,
      dismissedAt: null,
      reviewedAt: null,
    },
  });

  try {
    const { payload } = await readPrivatePlanningDataPayload();
    const vendors = getPlanningVendors(payload.vendors);
    const extractionResult = extractPrivatePlanningDetailsFromText({
      text: extractedText,
      vendors,
    });
    const possibleMatches = findPrivatePlanningVendorMatches(extractionResult.vendor, vendors);
    const matchedVendorId = possibleMatches[0]?.id ?? null;
    const updatedExtraction = await prisma.privatePlanningFileExtraction.update({
      where: { id: extraction.id },
      data: {
        extractionStatus: "review_needed",
        extractedVendor: extractionResult.vendor,
        extractedDocument: extractionResult.document,
        confidence: extractionResult.confidence,
        warnings: extractionResult.warnings,
        errorMessage: null,
        matchedVendorId,
        sourceModel: PRIVATE_PLANNING_EXTRACTION_SOURCE,
        reviewedAt: null,
        appliedAt: null,
        dismissedAt: null,
      },
    });
    const suggestion = await prisma.privatePlanningVendorSuggestion.create({
      data: {
        fileId: file.id,
        extractionId: updatedExtraction.id,
        suggestionStatus: "review_needed",
        suggestedVendor: extractionResult.vendor,
        suggestedDocument: extractionResult.document,
        confidence: extractionResult.confidence,
        warnings: extractionResult.warnings,
        possibleMatches,
        matchedVendorId,
      },
    });

    await createPrivatePlanningFileAuditLog(request, "extraction_completed", file.id, {
      suggestionId: suggestion.id,
      matchedVendorId,
      source: PRIVATE_PLANNING_EXTRACTION_SOURCE,
      method: extractionMethod,
    });

    return privatePlanningJson({
      ok: true,
      extraction: toPrivatePlanningFileExtractionDto(updatedExtraction, suggestion),
    });
  } catch (error) {
    const message = getExtractionFailureMessage(error);
    const failedExtraction = await prisma.privatePlanningFileExtraction.update({
      where: { id: extraction.id },
      data: {
        extractionStatus: "failed",
        errorMessage: message,
      },
    });

    await createPrivatePlanningFileAuditLog(request, "extraction_failed", file.id, {
      reason: message,
      source: PRIVATE_PLANNING_EXTRACTION_SOURCE,
      method: extractionMethod,
    });

    return privatePlanningJson(
      { ok: false, error: message, extraction: toPrivatePlanningFileExtractionDto(failedExtraction) },
      { status: /no readable text/i.test(message) ? 422 : 500 },
    );
  }
}
