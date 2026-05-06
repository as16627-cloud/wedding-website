import { randomUUID } from "node:crypto";
import { type Prisma } from "@/app/generated/prisma/client";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { readPrivatePlanningDataPayload, savePrivatePlanningDataPayload } from "@/lib/private-planning-data";
import { createPrivatePlanningFileAuditLog } from "@/lib/private-planning-files";
import { privatePlanningJson, verifyPrivatePlanningApiRequest, verifyPrivatePlanningMutationRequest } from "@/lib/private-planning-route";
import {
  buildPrivatePlanningVendorFromSuggestion,
  sanitizePrivatePlanningExtraction,
  toPrivatePlanningVendorSuggestionDto,
  type PrivatePlanningVendorRecord,
} from "@/lib/private-planning-vendor-extraction";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ApplyBody = {
  action?: unknown;
  vendor?: unknown;
  vendorId?: unknown;
};

function getPlanningVendors(value: unknown): PrivatePlanningVendorRecord[] {
  return Array.isArray(value) ? value.filter((vendor): vendor is PrivatePlanningVendorRecord => Boolean(vendor && typeof vendor === "object")) : [];
}

export async function POST(
  request: NextRequest,
  context: RouteContext<"/api/private-planning/vendor-suggestions/[suggestionId]/apply">,
) {
  const { suggestionId } = await context.params;
  const auth = await verifyPrivatePlanningApiRequest(request, "Private planning vendor suggestion apply");

  if (!auth.ok) {
    await createPrivatePlanningFileAuditLog(request, "vendor_suggestion_access_denied", null, { suggestionId, status: auth.response.status });
    return auth.response;
  }

  const mutation = verifyPrivatePlanningMutationRequest(request);

  if (!mutation.ok) {
    await createPrivatePlanningFileAuditLog(request, "vendor_suggestion_access_denied", null, { suggestionId, status: mutation.response.status });
    return mutation.response;
  }

  const body = (await request.json().catch(() => null)) as ApplyBody | null;
  const action = body?.action === "link" ? "link" : body?.action === "create" ? "create" : "";

  if (!action) {
    return privatePlanningJson({ ok: false, error: "Choose whether to create or link a vendor." }, { status: 400 });
  }

  const suggestion = await prisma.privatePlanningVendorSuggestion.findUnique({
    where: { id: suggestionId },
  });

  if (!suggestion) {
    return privatePlanningJson({ ok: false, error: "Suggestion not found." }, { status: 404 });
  }

  if (suggestion.suggestionStatus === "applied" || suggestion.suggestionStatus === "linked") {
    return privatePlanningJson({ ok: false, error: "This suggestion has already been applied." }, { status: 409 });
  }

  if (suggestion.suggestionStatus === "dismissed") {
    return privatePlanningJson({ ok: false, error: "This suggestion was dismissed. Re-run extraction before applying it." }, { status: 409 });
  }

  const file = await prisma.privatePlanningFile.findUnique({
    where: { id: suggestion.fileId },
    select: {
      id: true,
      originalFilename: true,
    },
  });

  const { payload } = await readPrivatePlanningDataPayload();
  const vendors = getPlanningVendors(payload.vendors);

  if (action === "link") {
    const vendorId = typeof body?.vendorId === "string" ? body.vendorId : "";
    const vendor = vendors.find((item) => item.id === vendorId);

    if (!vendor?.id) {
      return privatePlanningJson({ ok: false, error: "Choose an existing vendor to link." }, { status: 400 });
    }

    const now = new Date();
    const updatedSuggestion = await prisma.privatePlanningVendorSuggestion.update({
      where: { id: suggestion.id },
      data: {
        suggestionStatus: "linked",
        matchedVendorId: vendor.id,
        reviewedAt: now,
        appliedAt: now,
      },
    });

    if (suggestion.extractionId) {
      await prisma.privatePlanningFileExtraction.updateMany({
        where: { id: suggestion.extractionId },
        data: {
          extractionStatus: "linked",
          matchedVendorId: vendor.id,
          reviewedAt: now,
          appliedAt: now,
        },
      });
    }

    await prisma.privatePlanningFile.updateMany({
      where: { id: suggestion.fileId },
      data: { vendorId: vendor.id },
    });
    await createPrivatePlanningFileAuditLog(request, "vendor_suggestion_linked", suggestion.fileId, {
      suggestionId: suggestion.id,
      vendorId: vendor.id,
    });

    return privatePlanningJson({
      ok: true,
      action: "link",
      vendorId: vendor.id,
      suggestion: toPrivatePlanningVendorSuggestionDto(updatedSuggestion),
    });
  }

  const sanitized = sanitizePrivatePlanningExtraction({
    vendor: {
      ...(suggestion.suggestedVendor && typeof suggestion.suggestedVendor === "object" ? suggestion.suggestedVendor : {}),
      ...(body?.vendor && typeof body.vendor === "object" ? body.vendor : {}),
    },
    document: suggestion.suggestedDocument,
    confidence: suggestion.confidence,
    warnings: suggestion.warnings,
  });
  const newVendor = buildPrivatePlanningVendorFromSuggestion({
    id: `vendor-${randomUUID()}`,
    vendor: sanitized.vendor,
    document: sanitized.document,
    fileId: suggestion.fileId,
    sourceFilename: file?.originalFilename,
  });

  if (!newVendor.vendorName || newVendor.vendorName === "New vendor") {
    return privatePlanningJson({ ok: false, error: "Add a vendor name before creating a vendor." }, { status: 400 });
  }

  const nextPayload = {
    ...payload,
    vendors: [newVendor, ...vendors] as unknown as Prisma.InputJsonArray,
  };
  const now = new Date();

  await savePrivatePlanningDataPayload(nextPayload as Prisma.InputJsonObject);
  await prisma.privatePlanningFile.updateMany({
    where: { id: suggestion.fileId },
    data: { vendorId: newVendor.id },
  });
  const updatedSuggestion = await prisma.privatePlanningVendorSuggestion.update({
    where: { id: suggestion.id },
    data: {
      suggestionStatus: "applied",
      suggestedVendor: sanitized.vendor,
      suggestedDocument: sanitized.document,
      matchedVendorId: newVendor.id,
      reviewedAt: now,
      appliedAt: now,
    },
  });

  if (suggestion.extractionId) {
    await prisma.privatePlanningFileExtraction.updateMany({
      where: { id: suggestion.extractionId },
      data: {
        extractionStatus: "applied",
        extractedVendor: sanitized.vendor,
        extractedDocument: sanitized.document,
        matchedVendorId: newVendor.id,
        reviewedAt: now,
        appliedAt: now,
      },
    });
  }

  await createPrivatePlanningFileAuditLog(request, "vendor_suggestion_created", suggestion.fileId, {
    suggestionId: suggestion.id,
    vendorId: newVendor.id,
  });

  return privatePlanningJson({
    ok: true,
    action: "create",
    vendor: newVendor,
    vendorId: newVendor.id,
    suggestion: toPrivatePlanningVendorSuggestionDto(updatedSuggestion),
  });
}
