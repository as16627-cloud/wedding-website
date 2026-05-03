import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = typeof body.token === "string" ? body.token.trim() : "";

    if (!token) {
      return NextResponse.json(
        { ok: false, error: "Invite token is required." },
        { status: 400 }
      );
    }

    const guest = await prisma.guest.findUnique({
      where: { inviteToken: token },
    });

    if (!guest) {
      return NextResponse.json(
        { ok: false, error: "Invite not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      guest: {
        id: guest.id,
        fullName: guest.fullName,
        rsvpResponse: guest.rsvpResponse,
        attendingCeremony: guest.attendingCeremony,
        attendingReception: guest.attendingReception,
        bringingPlusOne: guest.bringingPlusOne,
        plusOneName: guest.plusOneName,
        dietaryRequirements: guest.dietaryRequirements,
        songRequest: guest.songRequest,
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { ok: false, error: "Something went wrong." },
      { status: 500 }
    );
  }
}
