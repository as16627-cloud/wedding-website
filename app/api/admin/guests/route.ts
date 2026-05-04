import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  buildGuestSummary,
  createRsvpToken,
  guestSelect,
  mapGuestForAdmin,
  normalizeRsvpStatus,
  optionalString,
  parseOptionalBoolean,
} from "@/lib/guest-rsvp";

export const runtime = "nodejs";

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE ?? "garden2026";

type GuestBody = {
  action?: string;
  id?: string;
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  side?: string;
  notes?: string;
  rsvpStatus?: string;
  rsvpResponse?: string;
  invitedToCeremony?: boolean | string | null;
  invitedToReception?: boolean | string | null;
  plusOneAllowed?: boolean | string | null;
  ceremonyResponse?: boolean | string | null;
  receptionResponse?: boolean | string | null;
  plusOneResponse?: boolean | string | null;
  attendingCeremony?: boolean | string | null;
  attendingReception?: boolean | string | null;
  bringingPlusOne?: boolean | string | null;
  plusOneName?: string;
  guestDietary?: string;
  dietaryRequirements?: string;
  plusOneDietary?: string;
  songRequest?: string;
  guestMessage?: string;
  message?: string;
};

type GuestUpdateData = {
  fullName?: string;
  phoneNumber?: string | null;
  email?: string | null;
  side?: string | null;
  notes?: string | null;
  invitedToCeremony?: boolean;
  invitedToReception?: boolean;
  plusOneAllowed?: boolean;
  smsSentAt?: Date | null;
  rsvpStatus?: string;
  rsvpResponse?: string;
  ceremonyResponse?: boolean | null;
  attendingCeremony?: boolean | null;
  receptionResponse?: boolean | null;
  attendingReception?: boolean | null;
  plusOneResponse?: boolean | null;
  bringingPlusOne?: boolean;
  plusOneName?: string | null;
  guestDietary?: string | null;
  dietaryRequirements?: string | null;
  plusOneDietary?: string | null;
  songRequest?: string | null;
  guestMessage?: string | null;
  message?: string | null;
  respondedAt?: Date | null;
};

function isAuthorized(request: Request) {
  return request.headers.get("x-admin-passcode") === ADMIN_PASSCODE;
}

function hasField(body: GuestBody, key: keyof GuestBody) {
  return Object.prototype.hasOwnProperty.call(body, key);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const guests = await prisma.guest.findMany({
    orderBy: [{ rsvpStatus: "asc" }, { fullName: "asc" }],
    select: guestSelect,
  });

  return NextResponse.json({
    ok: true,
    guests: guests.map(mapGuestForAdmin),
    summary: buildGuestSummary(guests),
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

  const rsvpToken = createRsvpToken();
  const rsvpStatus = normalizeRsvpStatus(body.rsvpStatus ?? body.rsvpResponse);
  const ceremonyResponse = parseOptionalBoolean(body.ceremonyResponse ?? body.attendingCeremony);
  const receptionResponse = parseOptionalBoolean(body.receptionResponse ?? body.attendingReception);
  const plusOneResponse = parseOptionalBoolean(body.plusOneResponse ?? body.bringingPlusOne);
  const guestDietary = optionalString(body.guestDietary) ?? optionalString(body.dietaryRequirements);
  const guestMessage = optionalString(body.guestMessage) ?? optionalString(body.message);

  const guest = await prisma.guest.create({
    data: {
      fullName,
      phoneNumber: optionalString(body.phoneNumber),
      email: optionalString(body.email),
      side: optionalString(body.side),
      notes: optionalString(body.notes),
      inviteToken: rsvpToken,
      rsvpToken,
      invitedToCeremony: parseOptionalBoolean(body.invitedToCeremony) ?? true,
      invitedToReception: parseOptionalBoolean(body.invitedToReception) ?? true,
      plusOneAllowed: parseOptionalBoolean(body.plusOneAllowed) ?? false,
      rsvpStatus,
      rsvpResponse: rsvpStatus,
      ceremonyResponse,
      attendingCeremony: ceremonyResponse,
      receptionResponse,
      attendingReception: receptionResponse,
      plusOneResponse,
      bringingPlusOne: Boolean(plusOneResponse),
      plusOneName: plusOneResponse ? optionalString(body.plusOneName) : null,
      guestDietary,
      dietaryRequirements: guestDietary,
      plusOneDietary: optionalString(body.plusOneDietary),
      songRequest: optionalString(body.songRequest),
      guestMessage,
      message: guestMessage,
      respondedAt: rsvpStatus === "Responded" ? new Date() : null,
    },
    select: guestSelect,
  });

  return NextResponse.json({ ok: true, guest: mapGuestForAdmin(guest) });
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

  if (body.action === "markSmsSent") {
    const guest = await prisma.guest.update({
      where: { id },
      data: { smsSentAt: new Date() },
      select: guestSelect,
    });

    return NextResponse.json({ ok: true, guest: mapGuestForAdmin(guest) });
  }

  const data: GuestUpdateData = {};

  if (hasField(body, "fullName")) {
    const fullName = optionalString(body.fullName);

    if (!fullName) {
      return NextResponse.json({ ok: false, error: "Guest name is required." }, { status: 400 });
    }

    data.fullName = fullName;
  }

  if (hasField(body, "phoneNumber")) data.phoneNumber = optionalString(body.phoneNumber);
  if (hasField(body, "email")) data.email = optionalString(body.email);
  if (hasField(body, "side")) data.side = optionalString(body.side);
  if (hasField(body, "notes")) data.notes = optionalString(body.notes);

  if (hasField(body, "invitedToCeremony")) {
    data.invitedToCeremony = parseOptionalBoolean(body.invitedToCeremony) ?? false;
  }

  if (hasField(body, "invitedToReception")) {
    data.invitedToReception = parseOptionalBoolean(body.invitedToReception) ?? false;
  }

  if (hasField(body, "plusOneAllowed")) {
    data.plusOneAllowed = parseOptionalBoolean(body.plusOneAllowed) ?? false;
  }

  if (hasField(body, "rsvpStatus") || hasField(body, "rsvpResponse")) {
    const rsvpStatus = normalizeRsvpStatus(body.rsvpStatus ?? body.rsvpResponse);
    data.rsvpStatus = rsvpStatus;
    data.rsvpResponse = rsvpStatus;
    data.respondedAt = rsvpStatus === "Responded" ? new Date() : null;
  }

  if (hasField(body, "ceremonyResponse") || hasField(body, "attendingCeremony")) {
    const ceremonyResponse = parseOptionalBoolean(body.ceremonyResponse ?? body.attendingCeremony);
    data.ceremonyResponse = ceremonyResponse;
    data.attendingCeremony = ceremonyResponse;
  }

  if (hasField(body, "receptionResponse") || hasField(body, "attendingReception")) {
    const receptionResponse = parseOptionalBoolean(body.receptionResponse ?? body.attendingReception);
    data.receptionResponse = receptionResponse;
    data.attendingReception = receptionResponse;
  }

  if (hasField(body, "plusOneResponse") || hasField(body, "bringingPlusOne")) {
    const plusOneResponse = parseOptionalBoolean(body.plusOneResponse ?? body.bringingPlusOne);
    data.plusOneResponse = plusOneResponse;
    data.bringingPlusOne = Boolean(plusOneResponse);
    data.plusOneName = plusOneResponse ? optionalString(body.plusOneName) : null;
    data.plusOneDietary = plusOneResponse ? optionalString(body.plusOneDietary) : null;
  } else if (hasField(body, "plusOneName")) {
    data.plusOneName = optionalString(body.plusOneName);
  }

  if (hasField(body, "guestDietary") || hasField(body, "dietaryRequirements")) {
    const guestDietary = optionalString(body.guestDietary) ?? optionalString(body.dietaryRequirements);
    data.guestDietary = guestDietary;
    data.dietaryRequirements = guestDietary;
  }

  if (hasField(body, "plusOneDietary")) data.plusOneDietary = optionalString(body.plusOneDietary);
  if (hasField(body, "songRequest")) data.songRequest = optionalString(body.songRequest);

  if (hasField(body, "guestMessage") || hasField(body, "message")) {
    const guestMessage = optionalString(body.guestMessage) ?? optionalString(body.message);
    data.guestMessage = guestMessage;
    data.message = guestMessage;
  }

  const guest = await prisma.guest.update({
    where: { id },
    data,
    select: guestSelect,
  });

  return NextResponse.json({ ok: true, guest: mapGuestForAdmin(guest) });
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
