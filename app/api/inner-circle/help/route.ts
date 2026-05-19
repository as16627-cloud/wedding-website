import { type Prisma } from "@/app/generated/prisma/client";
import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { readPrivatePlanningDataPayload, savePrivatePlanningDataPayload } from "@/lib/private-planning-data";
import { innerCircleJson, verifyInnerCircleApiRequest, verifyInnerCircleMutationRequest } from "@/lib/inner-circle-route";
import {
  checkPrivatePlanningLoginLimit,
  getPrivatePlanningRateLimitIdentity,
  recordPrivatePlanningLoginFailure,
} from "@/lib/private-planning-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_HELP_PAYLOAD_BYTES = 8_000;
const HELP_RATE_LIMIT_TARGET = "inner-circle-help";
const helpingHandOptions = [
  "Morning preparations",
  "Welcoming or directing guests",
  "Photo gathering",
  "Transport coordination",
  "End-of-night cards, gifts, or keepsakes",
  "A little bit of anything",
];

function cleanString(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

async function parseHelpPayload(request: NextRequest) {
  const rawBody = await request.text();

  if (Buffer.byteLength(rawBody, "utf8") > MAX_HELP_PAYLOAD_BYTES) {
    return { ok: false as const, error: "That note is a little too long." };
  }

  const parsed = JSON.parse(rawBody) as unknown;

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false as const, error: "We couldn't read that response." };
  }

  const record = parsed as Record<string, unknown>;

  if (cleanString(record.website, 120)) {
    return { ok: false as const, error: "We couldn't save that response." };
  }

  const name = cleanString(record.name, 80);
  const note = cleanString(record.note, 500);
  const helpWith = Array.isArray(record.helpWith)
    ? record.helpWith.filter((option): option is string => typeof option === "string" && helpingHandOptions.includes(option)).slice(0, 6)
    : [];

  if (!name) {
    return { ok: false as const, error: "Please add your name." };
  }

  if (helpWith.length === 0) {
    return { ok: false as const, error: "Please choose at least one way you would be happy to help." };
  }

  return { ok: true as const, response: { name, note, helpWith } };
}

function getExistingResponses(payload: Record<string, unknown>) {
  return Array.isArray(payload.innerCircleHelpingHands)
    ? payload.innerCircleHelpingHands.filter((item): item is Prisma.InputJsonObject => Boolean(item) && typeof item === "object" && !Array.isArray(item)).slice(-99)
    : [];
}

export async function POST(request: NextRequest) {
  const access = verifyInnerCircleApiRequest(request);

  if (!access.ok) {
    return access.response;
  }

  const mutation = verifyInnerCircleMutationRequest(request);

  if (!mutation.ok) {
    return mutation.response;
  }

  const identity = getPrivatePlanningRateLimitIdentity(request);
  const rateLimit = await checkPrivatePlanningLoginLimit(identity, { target: HELP_RATE_LIMIT_TARGET }).catch((error) => {
    console.error("Inner Circle help rate limit check failed.", error);
    return null;
  });

  if (!rateLimit) {
    return innerCircleJson({ ok: false, error: "Something didn't save. Please try again, or just message us if that's easier." }, { status: 503 });
  }

  if (!rateLimit.allowed) {
    return innerCircleJson(
      { ok: false, error: "Please wait a little before trying again, or just message us if that's easier." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSeconds),
        },
      },
    );
  }

  try {
    const parsed = await parseHelpPayload(request);

    if (!parsed.ok) {
      await recordPrivatePlanningLoginFailure(identity, { target: HELP_RATE_LIMIT_TARGET }).catch(() => null);
      return innerCircleJson({ ok: false, error: parsed.error }, { status: 400 });
    }

    const { payload } = await readPrivatePlanningDataPayload();
    const planningPayload = payload as Record<string, unknown>;
    const submittedAt = new Date().toISOString();
    const entry: Prisma.InputJsonObject = {
      id: randomUUID(),
      name: parsed.response.name,
      helpWith: parsed.response.helpWith,
      note: parsed.response.note,
      submittedAt,
    };
    const nextPayload = {
      ...planningPayload,
      innerCircleHelpingHands: [...getExistingResponses(planningPayload), entry],
    } as Prisma.InputJsonObject;

    await savePrivatePlanningDataPayload(nextPayload);
    await recordPrivatePlanningLoginFailure(identity, { target: HELP_RATE_LIMIT_TARGET }).catch(() => null);

    return innerCircleJson({
      ok: true,
      response: {
        ...entry,
        message: "Thank you - that means so much. We'll only reach out if it feels genuinely helpful.",
      },
    });
  } catch {
    console.error("Inner Circle help response save failed.");
    return innerCircleJson({ ok: false, error: "Something didn't save. Please try again, or just message us if that's easier." }, { status: 500 });
  }
}
