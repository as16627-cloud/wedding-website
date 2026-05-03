import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

const GUEST_LIST_PASSCODE =
  process.env.COUPLE_GUEST_LIST_PASSCODE ?? process.env.ADMIN_PASSCODE ?? "garden2026";
const MAX_RECIPIENTS_PER_REQUEST = 25;
const SMS_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const SMS_RATE_LIMIT_MAX_REQUESTS = 5;

const smsRateLimit = new Map<string, number[]>();

type SmsBody = {
  guestIds?: unknown;
};

type TwilioConfig = {
  accountSid: string;
  username: string;
  password: string;
  fromNumber: string | null;
  messagingServiceSid: string | null;
};

function isAuthorized(request: Request) {
  return request.headers.get("x-guest-list-passcode") === GUEST_LIST_PASSCODE;
}

function getClientKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || "local";
}

function checkRateLimit(request: Request) {
  const key = getClientKey(request);
  const now = Date.now();
  const recent = (smsRateLimit.get(key) ?? []).filter((timestamp) => now - timestamp < SMS_RATE_LIMIT_WINDOW_MS);

  if (recent.length >= SMS_RATE_LIMIT_MAX_REQUESTS) {
    smsRateLimit.set(key, recent);
    return false;
  }

  smsRateLimit.set(key, [...recent, now]);
  return true;
}

function getTwilioConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const apiKeySid = process.env.TWILIO_API_KEY_SID?.trim();
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const fromNumber = process.env.TWILIO_FROM_NUMBER?.trim() ?? null;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim() ?? null;
  const username = apiKeySid ?? accountSid;
  const password = apiKeySecret ?? authToken;
  const missing: string[] = [];

  if (!accountSid) {
    missing.push("TWILIO_ACCOUNT_SID");
  }

  if (!username || !password) {
    missing.push("TWILIO_API_KEY_SID + TWILIO_API_KEY_SECRET or TWILIO_AUTH_TOKEN");
  }

  if (!fromNumber && !messagingServiceSid) {
    missing.push("TWILIO_FROM_NUMBER or TWILIO_MESSAGING_SERVICE_SID");
  }

  if (missing.length > 0 || !accountSid || !username || !password) {
    return { missing };
  }

  return {
    config: {
      accountSid,
      username,
      password,
      fromNumber,
      messagingServiceSid,
    } satisfies TwilioConfig,
    missing,
  };
}

function getPublicSiteUrl(request: Request) {
  const configuredUrl =
    process.env.PUBLIC_SITE_URL?.trim() ??
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ??
    process.env.SITE_URL?.trim() ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ??
    process.env.VERCEL_URL?.trim();
  const rawUrl = configuredUrl
    ? configuredUrl.startsWith("http")
      ? configuredUrl
      : `https://${configuredUrl}`
    : new URL(request.url).origin;
  const parsedUrl = new URL(rawUrl);
  const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(parsedUrl.hostname);

  parsedUrl.pathname = "";
  parsedUrl.search = "";
  parsedUrl.hash = "";

  if (isLocalhost && process.env.SMS_ALLOW_LOCALHOST_LINKS !== "true") {
    return {
      error:
        "SMS links must use a public URL. Set PUBLIC_SITE_URL to your deployed site before sending real invitations.",
    };
  }

  if (process.env.NODE_ENV === "production" && parsedUrl.protocol !== "https:") {
    return { error: "PUBLIC_SITE_URL must use HTTPS in production." };
  }

  return { siteUrl: parsedUrl.origin };
}

function normalizePhoneNumber(value: string | null) {
  const defaultCountryCode = (process.env.SMS_DEFAULT_COUNTRY_CODE ?? "+61").replace(/[^\d+]/g, "");
  const countryDigits = defaultCountryCode.replace(/\D/g, "");
  let phone = value?.trim().replace(/[^\d+]/g, "") ?? "";

  if (!phone) {
    return null;
  }

  if (phone.startsWith("00")) {
    phone = `+${phone.slice(2)}`;
  } else if (phone.startsWith("+")) {
    phone = `+${phone.slice(1).replace(/\D/g, "")}`;
  } else if (phone.startsWith("0")) {
    phone = `+${countryDigits}${phone.slice(1)}`;
  } else if (phone.startsWith(countryDigits)) {
    phone = `+${phone}`;
  } else {
    phone = `${defaultCountryCode}${phone}`;
  }

  return /^\+[1-9]\d{7,14}$/.test(phone) ? phone : null;
}

function buildInviteLink(siteUrl: string, inviteToken: string) {
  const url = new URL(siteUrl);
  url.searchParams.set("guest", inviteToken);
  url.hash = "rsvp";
  return url.toString();
}

function buildInviteMessage(fullName: string, inviteLink: string) {
  return `Hi ${fullName}, please RSVP for Sumaya and Aditya's wedding here: ${inviteLink}`;
}

async function sendTwilioSms(config: TwilioConfig, to: string, body: string) {
  const params = new URLSearchParams({
    To: to,
    Body: body,
  });

  if (config.messagingServiceSid) {
    params.set("MessagingServiceSid", config.messagingServiceSid);
  } else if (config.fromNumber) {
    params.set("From", config.fromNumber);
  }

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.username}:${config.password}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    },
  );
  const result = (await response.json().catch(() => ({}))) as {
    sid?: string;
    status?: string;
    message?: string;
  };

  if (!response.ok) {
    throw new Error(result.message ?? `Twilio returned ${response.status}.`);
  }

  return {
    sid: result.sid ?? null,
    status: result.status ?? "queued",
  };
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "Incorrect passcode." }, { status: 401 });
  }

  if (!checkRateLimit(request)) {
    return NextResponse.json(
      { ok: false, error: "Too many SMS send attempts. Please wait a few minutes and try again." },
      { status: 429 },
    );
  }

  const { config, missing } = getTwilioConfig();

  if (!config) {
    return NextResponse.json(
      {
        ok: false,
        error: `SMS provider is not configured. Missing: ${missing.join(", ")}.`,
        missing,
      },
      { status: 501 },
    );
  }

  const { siteUrl, error: siteUrlError } = getPublicSiteUrl(request);

  if (!siteUrl) {
    return NextResponse.json({ ok: false, error: siteUrlError }, { status: 400 });
  }

  const body = (await request.json()) as SmsBody;
  const guestIds = Array.isArray(body.guestIds)
    ? [...new Set(body.guestIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0))]
    : [];

  if (guestIds.length === 0) {
    return NextResponse.json({ ok: false, error: "Select at least one guest." }, { status: 400 });
  }

  if (guestIds.length > MAX_RECIPIENTS_PER_REQUEST) {
    return NextResponse.json(
      { ok: false, error: `Please send to ${MAX_RECIPIENTS_PER_REQUEST} guests or fewer at a time.` },
      { status: 400 },
    );
  }

  const guests = await prisma.guest.findMany({
    where: {
      id: {
        in: guestIds,
      },
    },
    select: {
      id: true,
      fullName: true,
      phoneNumber: true,
      inviteToken: true,
    },
  });
  const guestById = new Map(guests.map((guest) => [guest.id, guest]));
  const sortedGuests = guestIds.map((id) => guestById.get(id)).filter((guest): guest is NonNullable<typeof guest> =>
    Boolean(guest),
  );
  const skipped = sortedGuests
    .filter((guest) => !normalizePhoneNumber(guest.phoneNumber))
    .map((guest) => ({ id: guest.id, fullName: guest.fullName, reason: "Missing or invalid phone number." }));
  const sendableGuests = sortedGuests
    .map((guest) => ({
      ...guest,
      normalizedPhone: normalizePhoneNumber(guest.phoneNumber),
    }))
    .filter((guest): guest is typeof guest & { normalizedPhone: string } => Boolean(guest.normalizedPhone));

  if (sendableGuests.length === 0) {
    return NextResponse.json(
      { ok: false, error: "None of the selected guests have a valid phone number.", skipped },
      { status: 400 },
    );
  }

  const sent: Array<{ id: string; fullName: string; sid: string | null; status: string }> = [];
  const failed: Array<{ id: string; fullName: string; error: string }> = [];

  for (const guest of sendableGuests) {
    try {
      const inviteLink = buildInviteLink(siteUrl, guest.inviteToken);
      const sms = await sendTwilioSms(config, guest.normalizedPhone, buildInviteMessage(guest.fullName, inviteLink));
      sent.push({
        id: guest.id,
        fullName: guest.fullName,
        sid: sms.sid,
        status: sms.status,
      });
    } catch (error) {
      failed.push({
        id: guest.id,
        fullName: guest.fullName,
        error: error instanceof Error ? error.message : "SMS provider rejected the message.",
      });
    }
  }

  return NextResponse.json(
    {
      ok: failed.length === 0,
      sent,
      skipped,
      failed,
      siteUrl,
    },
    { status: failed.length > 0 ? 207 : 200 },
  );
}
