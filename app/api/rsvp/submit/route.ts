import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

type RsvpBody = {
  guestId?: string;
  inviteToken?: string;
  token?: string;
  guestName?: string;
  attendingCeremony?: boolean | string;
  attendingReception?: boolean | string;
  bringingPlusOne?: boolean | string;
  plusOneName?: string;
  dietaryRequirements?: string;
  songRequest?: string;
  message?: string;
};

function optionalString(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : null;
}

function parseBoolean(value: unknown) {
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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RsvpBody;
    const guestId = optionalString(body.guestId);
    const inviteToken = optionalString(body.inviteToken) ?? optionalString(body.token);
    const guestName = optionalString(body.guestName);
    const attendingCeremony = parseBoolean(body.attendingCeremony);
    const attendingReception = parseBoolean(body.attendingReception);
    const bringingPlusOne = parseBoolean(body.bringingPlusOne) ?? false;
    const plusOneName = bringingPlusOne ? optionalString(body.plusOneName) : null;

    if (attendingCeremony === null || attendingReception === null) {
      return NextResponse.json(
        { ok: false, error: "Please answer both ceremony and reception attendance questions." },
        { status: 400 }
      );
    }

    if (bringingPlusOne && !plusOneName) {
      return NextResponse.json(
        { ok: false, error: "Please enter your +1's name." },
        { status: 400 }
      );
    }

    const guest = await prisma.guest.findFirst({
      where: guestId
        ? { id: guestId }
        : inviteToken
          ? { inviteToken }
          : guestName
            ? { fullName: guestName }
            : { id: "" },
    });

    if (!guest) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "We could not find that name on the guest list. Please use your invite link or message us to confirm.",
        },
        { status: 404 }
      );
    }

    const updatedGuest = await prisma.guest.update({
      where: { id: guest.id },
      data: {
        rsvpResponse: "Responded",
        attendingCeremony,
        attendingReception,
        bringingPlusOne,
        plusOneName,
        dietaryRequirements: optionalString(body.dietaryRequirements),
        songRequest: optionalString(body.songRequest),
        message: optionalString(body.message),
        respondedAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Thank you. Your RSVP has been saved.",
      guest: {
        id: updatedGuest.id,
        fullName: updatedGuest.fullName,
        rsvpResponse: updatedGuest.rsvpResponse,
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { ok: false, error: "Something went wrong while saving your RSVP." },
      { status: 500 }
    );
  }
}
