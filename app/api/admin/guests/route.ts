import { NextResponse } from "next/server";
import { privatePlanningNoStoreHeaders } from "@/lib/private-planning-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function movedResponse() {
  return NextResponse.json(
    { ok: false, error: "Guest admin moved to Private Planning." },
    {
      status: 410,
      headers: privatePlanningNoStoreHeaders,
    },
  );
}

export const GET = movedResponse;
export const POST = movedResponse;
export const PATCH = movedResponse;
export const DELETE = movedResponse;
