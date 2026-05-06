import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { createPrivatePlanningFileAuditLog } from "@/lib/private-planning-files";
import { privatePlanningJson, verifyPrivatePlanningApiRequest } from "@/lib/private-planning-route";
import { toPrivatePlanningFileExtractionDto } from "@/lib/private-planning-vendor-extraction";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: RouteContext<"/api/private-planning/files/[fileId]/extraction">,
) {
  const { fileId } = await context.params;
  const auth = await verifyPrivatePlanningApiRequest(request, "Private planning file extraction read");

  if (!auth.ok) {
    await createPrivatePlanningFileAuditLog(request, "extraction_access_denied", fileId, { status: auth.response.status });
    return auth.response;
  }

  const extraction = await prisma.privatePlanningFileExtraction.findUnique({
    where: { fileId },
  });
  const suggestion = await prisma.privatePlanningVendorSuggestion.findFirst({
    where: { fileId },
    orderBy: { createdAt: "desc" },
  });

  if (!extraction) {
    return privatePlanningJson({
      ok: true,
      status: "not_extracted",
      extraction: null,
    });
  }

  return privatePlanningJson({
    ok: true,
    status: extraction.extractionStatus,
    extraction: toPrivatePlanningFileExtractionDto(extraction, suggestion),
  });
}
