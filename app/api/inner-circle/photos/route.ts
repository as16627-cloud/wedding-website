import { NextRequest } from "next/server";
import { innerCircleJson, verifyInnerCircleApiRequest } from "@/lib/inner-circle-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const access = verifyInnerCircleApiRequest(request);

  if (!access.ok) {
    return access.response;
  }

  return innerCircleJson({
    ok: true,
    photos: [],
    emptyMessage: "Dress-trial photos will live here once we're ready to share them privately.",
  });
}
