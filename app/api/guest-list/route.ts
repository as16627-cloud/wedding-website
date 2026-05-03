import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

const GUEST_LIST_PASSCODE =
  process.env.COUPLE_GUEST_LIST_PASSCODE ?? process.env.ADMIN_PASSCODE ?? "garden2026";

function isAuthorized(request: Request) {
  return request.headers.get("x-guest-list-passcode") === GUEST_LIST_PASSCODE;
}

type GuestListBody = {
  id?: string;
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  side?: string;
  notes?: string;
  rsvpResponse?: string;
  attendingCeremony?: boolean | string | null;
  attendingReception?: boolean | string | null;
  bringingPlusOne?: boolean | string | null;
  plusOneName?: string;
  dietaryRequirements?: string;
  songRequest?: string;
  message?: string;
};

function optionalString(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : null;
}

function parseOptionalBoolean(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  if (["yes", "true", "1"].includes(normalized)) {
    return true;
  }

  if (["no", "false", "0"].includes(normalized)) {
    return false;
  }

  return null;
}

function createInviteToken() {
  return randomBytes(6).toString("hex").toUpperCase();
}

const guestListSelect = {
  id: true,
  fullName: true,
  phoneNumber: true,
  email: true,
  side: true,
  notes: true,
  inviteToken: true,
  rsvpResponse: true,
  attendingCeremony: true,
  attendingReception: true,
  bringingPlusOne: true,
  plusOneName: true,
  dietaryRequirements: true,
  songRequest: true,
  message: true,
  respondedAt: true,
  updatedAt: true,
} as const;

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Incorrect passcode." }, { status: 401 });
  }

  const guests = await prisma.guest.findMany({
    orderBy: [{ rsvpResponse: "asc" }, { fullName: "asc" }],
    select: guestListSelect,
  });

  return NextResponse.json({
    ok: true,
    guests,
    summary: {
      total: guests.length,
      responded: guests.filter((guest) => guest.rsvpResponse === "Responded").length,
      notResponded: guests.filter((guest) => guest.rsvpResponse !== "Responded").length,
      ceremonyYes: guests.filter((guest) => guest.attendingCeremony === true).length,
      receptionYes: guests.filter((guest) => guest.attendingReception === true).length,
      plusOnes: guests.filter((guest) => guest.bringingPlusOne).length,
      dietaryNotes: guests.filter((guest) => Boolean(guest.dietaryRequirements)).length,
    },
  });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Incorrect passcode." }, { status: 401 });
  }

  const body = (await request.json()) as GuestListBody;
  const fullName = optionalString(body.fullName);

  if (!fullName) {
    return NextResponse.json({ ok: false, error: "Guest name is required." }, { status: 400 });
  }

  const guest = await prisma.guest.create({
    data: {
      fullName,
      phoneNumber: optionalString(body.phoneNumber),
      email: optionalString(body.email),
      side: optionalString(body.side),
      notes: optionalString(body.notes),
      inviteToken: createInviteToken(),
      rsvpResponse: optionalString(body.rsvpResponse) === "Responded" ? "Responded" : "Not responded",
      attendingCeremony: parseOptionalBoolean(body.attendingCeremony),
      attendingReception: parseOptionalBoolean(body.attendingReception),
      bringingPlusOne: parseOptionalBoolean(body.bringingPlusOne) ?? false,
      plusOneName: optionalString(body.plusOneName),
      dietaryRequirements: optionalString(body.dietaryRequirements),
      songRequest: optionalString(body.songRequest),
      message: optionalString(body.message),
      respondedAt: optionalString(body.rsvpResponse) === "Responded" ? new Date() : null,
    },
    select: guestListSelect,
  });

  return NextResponse.json({ ok: true, guest });
}

export async function PATCH(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Incorrect passcode." }, { status: 401 });
  }

  const body = (await request.json()) as GuestListBody;
  const id = optionalString(body.id);

  if (!id) {
    return NextResponse.json({ ok: false, error: "Guest id is required." }, { status: 400 });
  }

  const fullName = optionalString(body.fullName);

  if (!fullName) {
    return NextResponse.json({ ok: false, error: "Guest name is required." }, { status: 400 });
  }

  const rsvpResponse = optionalString(body.rsvpResponse);
  const normalizedRsvp = rsvpResponse === "Responded" ? "Responded" : "Not responded";
  const bringingPlusOne = parseOptionalBoolean(body.bringingPlusOne) ?? false;

  const guest = await prisma.guest.update({
    where: { id },
    data: {
      fullName,
      phoneNumber: optionalString(body.phoneNumber),
      email: optionalString(body.email),
      side: optionalString(body.side),
      notes: optionalString(body.notes),
      rsvpResponse: normalizedRsvp,
      attendingCeremony: parseOptionalBoolean(body.attendingCeremony),
      attendingReception: parseOptionalBoolean(body.attendingReception),
      bringingPlusOne,
      plusOneName: bringingPlusOne ? optionalString(body.plusOneName) : null,
      dietaryRequirements: optionalString(body.dietaryRequirements),
      songRequest: optionalString(body.songRequest),
      message: optionalString(body.message),
      respondedAt: normalizedRsvp === "Responded" ? new Date() : null,
    },
    select: guestListSelect,
  });

  return NextResponse.json({ ok: true, guest });
}

export async function DELETE(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Incorrect passcode." }, { status: 401 });
  }

  const body = (await request.json()) as GuestListBody;
  const id = optionalString(body.id);

  if (!id) {
    return NextResponse.json({ ok: false, error: "Guest id is required." }, { status: 400 });
  }

  await prisma.guest.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
