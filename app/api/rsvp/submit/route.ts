import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  guestSelect,
  mapGuestForPublic,
  optionalString,
  parseOptionalBoolean,
} from "@/lib/guest-rsvp";
import { privatePlanningNoStoreHeaders } from "@/lib/private-planning-auth";

export const runtime = "nodejs";

type RsvpBody = {
  token?: string;
  rsvpToken?: string;
  ceremonyResponse?: boolean | string | null;
  receptionResponse?: boolean | string | null;
  plusOneResponse?: boolean | string | null;
  plusOneName?: string;
  guestDietary?: string;
  dietaryRequirements?: string;
  plusOneDietary?: string;
  songRequest?: string;
  guestMessage?: string;
  message?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RsvpBody;
    const token = optionalString(body.rsvpToken) ?? optionalString(body.token);

    if (!token) {
      return NextResponse.json(
        { ok: false, error: "Please use your private RSVP link." },
        { status: 400, headers: privatePlanningNoStoreHeaders },
      );
    }

    const guest = await prisma.guest.findFirst({
      where: {
        OR: [{ rsvpToken: token }, { inviteToken: token }],
      },
      select: guestSelect,
    });

    if (!guest) {
      return NextResponse.json(
        { ok: false, error: "We could not find this RSVP link. Please message us to confirm." },
        { status: 404, headers: privatePlanningNoStoreHeaders },
      );
    }

    const ceremonyResponse = guest.invitedToCeremony ? parseOptionalBoolean(body.ceremonyResponse) : null;
    const receptionResponse = guest.invitedToReception ? parseOptionalBoolean(body.receptionResponse) : null;
    const plusOneResponse = guest.plusOneAllowed ? parseOptionalBoolean(body.plusOneResponse) : false;
    const plusOneName = plusOneResponse ? optionalString(body.plusOneName) : null;
    const guestDietary = optionalString(body.guestDietary) ?? optionalString(body.dietaryRequirements);
    const guestMessage = optionalString(body.guestMessage) ?? optionalString(body.message);

    if (guest.invitedToCeremony && ceremonyResponse === null) {
      return NextResponse.json(
        { ok: false, error: "Please answer the ceremony attendance question." },
        { status: 400, headers: privatePlanningNoStoreHeaders },
      );
    }

    if (guest.invitedToReception && receptionResponse === null) {
      return NextResponse.json(
        { ok: false, error: "Please answer the reception attendance question." },
        { status: 400, headers: privatePlanningNoStoreHeaders },
      );
    }

    if (guest.plusOneAllowed && plusOneResponse === null) {
      return NextResponse.json(
        { ok: false, error: "Please answer the plus-one question." },
        { status: 400, headers: privatePlanningNoStoreHeaders },
      );
    }

    if (plusOneResponse && !plusOneName) {
      return NextResponse.json(
        { ok: false, error: "Please enter your plus-one's full name." },
        { status: 400, headers: privatePlanningNoStoreHeaders },
      );
    }

    const updatedGuest = await prisma.guest.update({
      where: { id: guest.id },
      data: {
        rsvpStatus: "Responded",
        rsvpResponse: "Responded",
        ceremonyResponse,
        attendingCeremony: ceremonyResponse,
        receptionResponse,
        attendingReception: receptionResponse,
        plusOneResponse,
        bringingPlusOne: Boolean(plusOneResponse),
        plusOneName,
        guestDietary,
        dietaryRequirements: guestDietary,
        plusOneDietary: plusOneResponse ? optionalString(body.plusOneDietary) : null,
        songRequest: optionalString(body.songRequest),
        guestMessage,
        message: guestMessage,
        respondedAt: new Date(),
      },
      select: guestSelect,
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Thank you. Your RSVP has been saved.",
        guest: mapGuestForPublic(updatedGuest),
      },
      { headers: privatePlanningNoStoreHeaders },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { ok: false, error: "Something went wrong while saving your RSVP." },
      { status: 500, headers: privatePlanningNoStoreHeaders },
    );
  }
}
