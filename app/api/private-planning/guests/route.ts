import { type Prisma } from "@/app/generated/prisma/client";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { buildGuestSummary, guestSelect, mapGuestForAdmin, optionalString } from "@/lib/guest-rsvp";
import { createPrivatePlanningFileAuditLog } from "@/lib/private-planning-files";
import {
  buildPrivatePlanningGuestCreateData,
  buildPrivatePlanningGuestUpdateData,
  type PrivatePlanningGuestBody,
} from "@/lib/private-planning-guests";
import {
  privatePlanningJson,
  verifyPrivatePlanningApiRequest,
  verifyPrivatePlanningMutationRequest,
} from "@/lib/private-planning-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseGuestBody(request: NextRequest) {
  return request.json().catch(() => null) as Promise<PrivatePlanningGuestBody | null>;
}

export async function GET(request: NextRequest) {
  const auth = await verifyPrivatePlanningApiRequest(request, "Private planning guest list");

  if (!auth.ok) {
    await createPrivatePlanningFileAuditLog(request, "guest_access_denied", null, { status: auth.response.status });
    return auth.response;
  }

  try {
    const guests = await prisma.guest.findMany({
      orderBy: [{ rsvpStatus: "asc" }, { fullName: "asc" }],
      select: guestSelect,
    });

    return privatePlanningJson({
      ok: true,
      guests: guests.map(mapGuestForAdmin),
      summary: buildGuestSummary(guests),
    });
  } catch (error) {
    console.error("Private planning guest load failed.", error);
    return privatePlanningJson({ ok: false, error: "Database error - could not load guests." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyPrivatePlanningApiRequest(request, "Private planning guest create");

  if (!auth.ok) {
    await createPrivatePlanningFileAuditLog(request, "guest_access_denied", null, { status: auth.response.status });
    return auth.response;
  }

  const mutation = verifyPrivatePlanningMutationRequest(request);

  if (!mutation.ok) {
    await createPrivatePlanningFileAuditLog(request, "guest_access_denied", null, { status: mutation.response.status });
    return mutation.response;
  }

  const body = await parseGuestBody(request);
  const built = buildPrivatePlanningGuestCreateData(body ?? {});

  if (!built.ok) {
    return privatePlanningJson({ ok: false, error: built.error }, { status: 400 });
  }

  const guest = await prisma.guest.create({
    data: built.data,
    select: guestSelect,
  });

  await createPrivatePlanningFileAuditLog(request, "guest_create", null, {
    guestId: guest.id,
    hasEmail: Boolean(guest.email),
    hasPhone: Boolean(guest.phoneNumber),
  });

  return privatePlanningJson({ ok: true, guest: mapGuestForAdmin(guest) });
}

export async function PATCH(request: NextRequest) {
  const auth = await verifyPrivatePlanningApiRequest(request, "Private planning guest update");

  if (!auth.ok) {
    await createPrivatePlanningFileAuditLog(request, "guest_access_denied", null, { status: auth.response.status });
    return auth.response;
  }

  const mutation = verifyPrivatePlanningMutationRequest(request);

  if (!mutation.ok) {
    await createPrivatePlanningFileAuditLog(request, "guest_access_denied", null, { status: mutation.response.status });
    return mutation.response;
  }

  const body = await parseGuestBody(request);
  const built = buildPrivatePlanningGuestUpdateData(body ?? {});

  if (!built.ok) {
    return privatePlanningJson({ ok: false, error: built.error }, { status: 400 });
  }

  const guest = await prisma.guest.update({
    where: { id: built.id },
    data: built.data,
    select: guestSelect,
  });

  await createPrivatePlanningFileAuditLog(request, built.auditAction, null, {
    guestId: guest.id,
    changedFields: Object.keys(built.data as Prisma.InputJsonObject).sort(),
  });

  return privatePlanningJson({ ok: true, guest: mapGuestForAdmin(guest) });
}

export async function DELETE(request: NextRequest) {
  const auth = await verifyPrivatePlanningApiRequest(request, "Private planning guest delete");

  if (!auth.ok) {
    await createPrivatePlanningFileAuditLog(request, "guest_access_denied", null, { status: auth.response.status });
    return auth.response;
  }

  const mutation = verifyPrivatePlanningMutationRequest(request);

  if (!mutation.ok) {
    await createPrivatePlanningFileAuditLog(request, "guest_access_denied", null, { status: mutation.response.status });
    return mutation.response;
  }

  const body = await parseGuestBody(request);
  const id = optionalString(body?.id);

  if (!id) {
    return privatePlanningJson({ ok: false, error: "Guest id is required." }, { status: 400 });
  }

  const guest = await prisma.guest.delete({
    where: { id },
    select: {
      id: true,
      fullName: true,
    },
  });

  await createPrivatePlanningFileAuditLog(request, "guest_delete", null, {
    guestId: guest.id,
    guestName: guest.fullName,
  });

  return privatePlanningJson({ ok: true });
}
