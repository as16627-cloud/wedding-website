import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { buildGuestSummary, guestSelect, mapGuestForAdmin } from "@/lib/guest-rsvp";
import { createPrivatePlanningFileAuditLog } from "@/lib/private-planning-files";
import {
  buildPrivatePlanningGuestCreateData,
  type PrivatePlanningGuestBody,
} from "@/lib/private-planning-guests";
import {
  privatePlanningJson,
  verifyPrivatePlanningApiRequest,
  verifyPrivatePlanningMutationRequest,
} from "@/lib/private-planning-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_GUEST_IMPORT_COUNT = 250;

export async function POST(request: NextRequest) {
  const auth = await verifyPrivatePlanningApiRequest(request, "Private planning guest import");

  if (!auth.ok) {
    await createPrivatePlanningFileAuditLog(request, "guest_import_access_denied", null, { status: auth.response.status });
    return auth.response;
  }

  const mutation = verifyPrivatePlanningMutationRequest(request);

  if (!mutation.ok) {
    await createPrivatePlanningFileAuditLog(request, "guest_import_access_denied", null, { status: mutation.response.status });
    return mutation.response;
  }

  const body = (await request.json().catch(() => null)) as { guests?: unknown } | null;
  const rawGuests = Array.isArray(body?.guests) ? body.guests : null;

  if (!rawGuests) {
    return privatePlanningJson({ ok: false, error: "Guest import must include a guests array." }, { status: 400 });
  }

  if (rawGuests.length > MAX_GUEST_IMPORT_COUNT) {
    return privatePlanningJson({ ok: false, error: `Import ${MAX_GUEST_IMPORT_COUNT} guests or fewer at a time.` }, { status: 400 });
  }

  let createInputs;

  try {
    createInputs = rawGuests.map((rawGuest, index) => {
    const built = buildPrivatePlanningGuestCreateData((rawGuest && typeof rawGuest === "object" ? rawGuest : {}) as PrivatePlanningGuestBody);

    if (!built.ok) {
      throw new Error(`Guest ${index + 1}: ${built.error}`);
    }

    return built.data;
  });
  } catch (error) {
    return privatePlanningJson({ ok: false, error: error instanceof Error ? error.message : "Guest import could not be validated." }, { status: 400 });
  }

  const createdGuests = await prisma.$transaction(
    createInputs.map((data) =>
      prisma.guest.create({
        data,
        select: guestSelect,
      }),
    ),
  );
  const guests = await prisma.guest.findMany({
    orderBy: [{ rsvpStatus: "asc" }, { fullName: "asc" }],
    select: guestSelect,
  });

  await createPrivatePlanningFileAuditLog(request, "guest_import", null, {
    importedCount: createdGuests.length,
  });

  return privatePlanningJson({
    ok: true,
    importedCount: createdGuests.length,
    guests: guests.map(mapGuestForAdmin),
    summary: buildGuestSummary(guests),
  });
}
