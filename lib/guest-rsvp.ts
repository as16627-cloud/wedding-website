import { randomBytes } from "node:crypto";

export type RsvpStatus = "Responded" | "Not responded";

export type GuestRecord = {
  id: string;
  fullName: string;
  phoneNumber: string | null;
  email: string | null;
  side: string | null;
  notes: string | null;
  inviteToken: string;
  rsvpToken: string | null;
  invitedToCeremony: boolean;
  invitedToReception: boolean;
  plusOneAllowed: boolean;
  smsSentAt: Date | null;
  rsvpResponse: string;
  rsvpStatus: string;
  attendingCeremony: boolean | null;
  attendingReception: boolean | null;
  bringingPlusOne: boolean;
  ceremonyResponse: boolean | null;
  receptionResponse: boolean | null;
  plusOneResponse: boolean | null;
  plusOneName: string | null;
  dietaryRequirements: string | null;
  guestDietary: string | null;
  plusOneDietary: string | null;
  songRequest: string | null;
  message: string | null;
  guestMessage: string | null;
  respondedAt: Date | null;
  createdAt?: Date;
  updatedAt: Date;
};

export const guestSelect = {
  id: true,
  fullName: true,
  phoneNumber: true,
  email: true,
  side: true,
  notes: true,
  inviteToken: true,
  rsvpToken: true,
  invitedToCeremony: true,
  invitedToReception: true,
  plusOneAllowed: true,
  smsSentAt: true,
  rsvpResponse: true,
  rsvpStatus: true,
  attendingCeremony: true,
  attendingReception: true,
  bringingPlusOne: true,
  ceremonyResponse: true,
  receptionResponse: true,
  plusOneResponse: true,
  plusOneName: true,
  dietaryRequirements: true,
  guestDietary: true,
  plusOneDietary: true,
  songRequest: true,
  message: true,
  guestMessage: true,
  respondedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export function optionalString(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : null;
}

export function parseOptionalBoolean(value: unknown) {
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

export function normalizeRsvpStatus(value: unknown): RsvpStatus {
  return optionalString(value) === "Responded" ? "Responded" : "Not responded";
}

export function createRsvpToken() {
  return randomBytes(10).toString("base64url");
}

export function getRsvpToken(guest: Pick<GuestRecord, "rsvpToken" | "inviteToken">) {
  return guest.rsvpToken ?? guest.inviteToken;
}

export function getRsvpStatus(guest: Pick<GuestRecord, "rsvpStatus" | "rsvpResponse">): RsvpStatus {
  return guest.rsvpStatus === "Responded" || guest.rsvpResponse === "Responded" ? "Responded" : "Not responded";
}

export function getCeremonyResponse(
  guest: Pick<GuestRecord, "ceremonyResponse" | "attendingCeremony">,
) {
  return guest.ceremonyResponse ?? guest.attendingCeremony;
}

export function getReceptionResponse(
  guest: Pick<GuestRecord, "receptionResponse" | "attendingReception">,
) {
  return guest.receptionResponse ?? guest.attendingReception;
}

export function getPlusOneResponse(
  guest: Pick<GuestRecord, "plusOneResponse" | "bringingPlusOne">,
) {
  return guest.plusOneResponse ?? guest.bringingPlusOne;
}

export function getGuestDietary(
  guest: Pick<GuestRecord, "guestDietary" | "dietaryRequirements">,
) {
  return guest.guestDietary ?? guest.dietaryRequirements;
}

export function getGuestMessage(guest: Pick<GuestRecord, "guestMessage" | "message">) {
  return guest.guestMessage ?? guest.message;
}

export function mapGuestForAdmin(guest: GuestRecord) {
  const rsvpToken = getRsvpToken(guest);
  const rsvpStatus = getRsvpStatus(guest);
  const ceremonyResponse = getCeremonyResponse(guest);
  const receptionResponse = getReceptionResponse(guest);
  const plusOneResponse = getPlusOneResponse(guest);
  const guestDietary = getGuestDietary(guest);
  const guestMessage = getGuestMessage(guest);

  return {
    ...guest,
    rsvpToken,
    rsvpStatus,
    rsvpResponse: rsvpStatus,
    ceremonyResponse,
    receptionResponse,
    plusOneResponse,
    attendingCeremony: ceremonyResponse,
    attendingReception: receptionResponse,
    bringingPlusOne: Boolean(plusOneResponse),
    guestDietary,
    dietaryRequirements: guestDietary,
    guestMessage,
    message: guestMessage,
  };
}

export function mapGuestForPublic(guest: GuestRecord) {
  return {
    fullName: guest.fullName,
    rsvpStatus: getRsvpStatus(guest),
    invitedToCeremony: guest.invitedToCeremony,
    invitedToReception: guest.invitedToReception,
    plusOneAllowed: guest.plusOneAllowed,
    ceremonyResponse: getCeremonyResponse(guest),
    receptionResponse: getReceptionResponse(guest),
    plusOneResponse: getPlusOneResponse(guest),
    plusOneName: guest.plusOneName,
    guestDietary: getGuestDietary(guest),
    plusOneDietary: guest.plusOneDietary,
    songRequest: guest.songRequest,
    guestMessage: getGuestMessage(guest),
    respondedAt: guest.respondedAt,
  };
}

export function buildGuestSummary(guests: GuestRecord[]) {
  const mappedGuests = guests.map(mapGuestForAdmin);
  const attendingHeadcount = mappedGuests.reduce((total, guest) => {
    const attendingAny = guest.ceremonyResponse === true || guest.receptionResponse === true;

    if (!attendingAny) {
      return total;
    }

    return total + 1 + (guest.plusOneResponse ? 1 : 0);
  }, 0);

  return {
    total: mappedGuests.length,
    headcount: attendingHeadcount,
    responded: mappedGuests.filter((guest) => guest.rsvpStatus === "Responded").length,
    notResponded: mappedGuests.filter((guest) => guest.rsvpStatus !== "Responded").length,
    ceremonyYes: mappedGuests.filter((guest) => guest.ceremonyResponse === true).length,
    receptionYes: mappedGuests.filter((guest) => guest.receptionResponse === true).length,
    plusOnes: mappedGuests.filter((guest) => guest.plusOneResponse === true).length,
    dietaryNotes: mappedGuests.filter((guest) => Boolean(guest.guestDietary || guest.plusOneDietary)).length,
    noPhone: mappedGuests.filter((guest) => !guest.phoneNumber).length,
    smsNotSent: mappedGuests.filter((guest) => !guest.smsSentAt).length,
  };
}
