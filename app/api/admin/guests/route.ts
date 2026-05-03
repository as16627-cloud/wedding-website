import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE ?? "garden2026";

type GuestBody = {
  id?: string;
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  side?: string;
  notes?: string;
  rsvpResponse?: string;
};

function isAuthorized(request: Request) {
  return request.headers.get("x-admin-passcode") === ADMIN_PASSCODE;
}

function optionalString(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : null;
}

function createInviteToken() {
  return randomBytes(6).toString("hex").toUpperCase();
}

const guestSelect = {
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
  createdAt: true,
  updatedAt: true,
} as const;

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const guests = await prisma.guest.findMany({
    orderBy: [{ rsvpResponse: "asc" }, { fullName: "asc" }],
    select: guestSelect,
  });

  return NextResponse.json({
    ok: true,
    guests,
    summary: {
      total: guests.length,
      responded: guests.filter((guest) => guest.rsvpResponse === "Responded").length,
      notResponded: guests.filter((guest) => guest.rsvpResponse !== "Responded").length,
    },
  });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json()) as GuestBody;
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
    },
    select: guestSelect,
  });

  return NextResponse.json({ ok: true, guest });
}

export async function PATCH(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json()) as GuestBody;
  const id = optionalString(body.id);

  if (!id) {
    return NextResponse.json({ ok: false, error: "Guest id is required." }, { status: 400 });
  }

  const rsvpResponse = optionalString(body.rsvpResponse);
  const guest = await prisma.guest.update({
    where: { id },
    data: {
      fullName: optionalString(body.fullName) ?? undefined,
      phoneNumber: optionalString(body.phoneNumber),
      email: optionalString(body.email),
      side: optionalString(body.side),
      notes: optionalString(body.notes),
      rsvpResponse:
        rsvpResponse === "Responded" || rsvpResponse === "Not responded" ? rsvpResponse : undefined,
      respondedAt: rsvpResponse === "Not responded" ? null : undefined,
    },
    select: guestSelect,
  });

  return NextResponse.json({ ok: true, guest });
}

export async function DELETE(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json()) as GuestBody;
  const id = optionalString(body.id);

  if (!id) {
    return NextResponse.json({ ok: false, error: "Guest id is required." }, { status: 400 });
  }

  await prisma.guest.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
