import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { createPrivatePlanningFileAuditLog } from "@/lib/private-planning-files";
import { privatePlanningJson, verifyPrivatePlanningApiRequest, verifyPrivatePlanningMutationRequest } from "@/lib/private-planning-route";
import { toPrivatePlanningVendorSuggestionDto } from "@/lib/private-planning-vendor-extraction";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  context: RouteContext<"/api/private-planning/vendor-suggestions/[suggestionId]/dismiss">,
) {
  const { suggestionId } = await context.params;
  const auth = await verifyPrivatePlanningApiRequest(request, "Private planning vendor suggestion dismiss");

  if (!auth.ok) {
    await createPrivatePlanningFileAuditLog(request, "vendor_suggestion_access_denied", null, { suggestionId, status: auth.response.status });
    return auth.response;
  }

  const mutation = verifyPrivatePlanningMutationRequest(request);

  if (!mutation.ok) {
    await createPrivatePlanningFileAuditLog(request, "vendor_suggestion_access_denied", null, { suggestionId, status: mutation.response.status });
    return mutation.response;
  }

  const suggestion = await prisma.privatePlanningVendorSuggestion.findUnique({
    where: { id: suggestionId },
  });

  if (!suggestion) {
    return privatePlanningJson({ ok: false, error: "Suggestion not found." }, { status: 404 });
  }

  const now = new Date();
  const updatedSuggestion = await prisma.privatePlanningVendorSuggestion.update({
    where: { id: suggestion.id },
    data: {
      suggestionStatus: "dismissed",
      reviewedAt: now,
      dismissedAt: now,
    },
  });

  if (suggestion.extractionId) {
    await prisma.privatePlanningFileExtraction.updateMany({
      where: { id: suggestion.extractionId },
      data: {
        extractionStatus: "dismissed",
        reviewedAt: now,
        dismissedAt: now,
      },
    });
  }

  await createPrivatePlanningFileAuditLog(request, "vendor_suggestion_dismissed", suggestion.fileId, {
    suggestionId: suggestion.id,
  });

  return privatePlanningJson({
    ok: true,
    suggestion: toPrivatePlanningVendorSuggestionDto(updatedSuggestion),
  });
}
