import { type Prisma } from "@/app/generated/prisma/client";
import {
  createRsvpToken,
  getCeremonyResponse,
  getGuestDietary,
  getGuestMessage,
  getPlusOneResponse,
  getReceptionResponse,
  getRsvpStatus,
  normalizeRsvpStatus,
  optionalString,
  parseOptionalBoolean,
  type GuestRecord,
} from "@/lib/guest-rsvp";

export type PrivatePlanningGuestBody = {
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

function hasField(body: PrivatePlanningGuestBody, key: keyof PrivatePlanningGuestBody) {
  return Object.prototype.hasOwnProperty.call(body, key);
}

export function buildPrivatePlanningGuestCreateData(body: PrivatePlanningGuestBody) {
  const fullName = optionalString(body.fullName);

  if (!fullName) {
    return { ok: false as const, error: "Guest name is required." };
  }

  const rsvpToken = createRsvpToken();
  const rsvpStatus = normalizeRsvpStatus(body.rsvpStatus ?? body.rsvpResponse);
  const ceremonyResponse = parseOptionalBoolean(body.ceremonyResponse ?? body.attendingCeremony);
  const receptionResponse = parseOptionalBoolean(body.receptionResponse ?? body.attendingReception);
  const plusOneResponse = parseOptionalBoolean(body.plusOneResponse ?? body.bringingPlusOne);
  const guestDietary = optionalString(body.guestDietary) ?? optionalString(body.dietaryRequirements);
  const guestMessage = optionalString(body.guestMessage) ?? optionalString(body.message);

  return {
    ok: true as const,
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
    } satisfies Prisma.GuestCreateInput,
  };
}

export function buildPrivatePlanningGuestUpdateData(body: PrivatePlanningGuestBody) {
  const id = optionalString(body.id);

  if (!id) {
    return { ok: false as const, error: "Guest id is required." };
  }

  if (body.action === "markSmsSent") {
    return {
      ok: true as const,
      id,
      data: { smsSentAt: new Date() } satisfies Prisma.GuestUpdateInput,
      auditAction: "guest_sms_marked",
    };
  }

  const data: Prisma.GuestUpdateInput = {};

  if (hasField(body, "fullName")) {
    const fullName = optionalString(body.fullName);

    if (!fullName) {
      return { ok: false as const, error: "Guest name is required." };
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

  return {
    ok: true as const,
    id,
    data,
    auditAction: "guest_update",
  };
}

function csvCell(value: string | number | boolean | Date | null | undefined) {
  const text = value === null || value === undefined ? "" : value instanceof Date ? value.toISOString() : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function formatAnswer(value: boolean | null) {
  if (value === null) {
    return "Not answered";
  }

  return value ? "Yes" : "No";
}

export function buildPrivatePlanningGuestCsv(guests: GuestRecord[]) {
  const headers = [
    "Name",
    "Phone",
    "Email",
    "Side",
    "RSVP",
    "Ceremony",
    "Reception",
    "Plus one",
    "Plus one name",
    "Dietary requirements",
    "Song request",
    "Message",
    "Notes",
    "Responded at",
  ];
  const rows = guests.map((guest) => [
    guest.fullName,
    guest.phoneNumber,
    guest.email,
    guest.side,
    getRsvpStatus(guest),
    formatAnswer(getCeremonyResponse(guest)),
    formatAnswer(getReceptionResponse(guest)),
    getPlusOneResponse(guest) ? "Yes" : "No",
    guest.plusOneName,
    [getGuestDietary(guest), guest.plusOneDietary].filter(Boolean).join(" / "),
    guest.songRequest,
    getGuestMessage(guest),
    guest.notes,
    guest.respondedAt,
  ]);

  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}
