import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { guestSelect, mapGuestForPublic, optionalString } from "@/lib/guest-rsvp";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = optionalString(body.token);

    if (!token) {
      return NextResponse.json(
        { ok: false, error: "RSVP token is required." },
        { status: 400 },
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
        { ok: false, error: "Invite not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      guest: mapGuestForPublic(guest),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { ok: false, error: "Something went wrong." },
      { status: 500 },
    );
  }
}
