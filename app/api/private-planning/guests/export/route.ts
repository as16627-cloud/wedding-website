import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { guestSelect } from "@/lib/guest-rsvp";
import { createPrivatePlanningFileAuditLog } from "@/lib/private-planning-files";
import { buildPrivatePlanningGuestCsv } from "@/lib/private-planning-guests";
import { privatePlanningNoStoreHeaders } from "@/lib/private-planning-auth";
import { privatePlanningJson, verifyPrivatePlanningApiRequest } from "@/lib/private-planning-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await verifyPrivatePlanningApiRequest(request, "Private planning guest export");

  if (!auth.ok) {
    await createPrivatePlanningFileAuditLog(request, "guest_export_access_denied", null, { status: auth.response.status });
    return auth.response;
  }

  const guests = await prisma.guest.findMany({
    orderBy: [{ rsvpStatus: "asc" }, { fullName: "asc" }],
    select: guestSelect,
  });
  const csv = buildPrivatePlanningGuestCsv(guests);

  await createPrivatePlanningFileAuditLog(request, "guest_export", null, {
    format: "csv",
    count: guests.length,
  });

  return new NextResponse(csv, {
    headers: {
      ...privatePlanningNoStoreHeaders,
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="sumaya-aditya-guest-list.csv"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function POST() {
  return privatePlanningJson({ ok: false, error: "Use GET to export the guest list." }, { status: 405 });
}
