import { NextRequest, NextResponse } from "next/server";
import { readPrivatePlanningDataPayload } from "@/lib/private-planning-data";
import { verifyInnerCircleApiRequest } from "@/lib/inner-circle-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bridalPartyFashionType = "Bridal Party / Fashion";
const publicPlanningTimezone = "Australia/Perth";

const fallbackBridalPartyFashionEvents = [
  {
    id: "event-azazie-bridesmaid-dress-popup",
    title: "Azazie Bridesmaid Dress Pop-up Appointment",
    date: "2026-05-16",
    type: bridalPartyFashionType,
    notes:
      "Time: 2:00 p.m. - 4:00 p.m. Status: Upcoming. Attend Azazie pop-up shop appointment with bridal party to try on and purchase bridesmaid dresses. Tasks during appointment: try shortlisted dress styles; compare fabric and colour options; review fit and sizing for each bridesmaid; take reference photos; finalise preferred dress direction; purchase dresses if ready.",
  },
];

type PublicInnerCircleDate = {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  notes?: string;
};

function toDateKeyInTimezone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

function normalizeDateValue(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  const isoMatch = trimmed.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);

  if (!isoMatch) {
    return "";
  }

  const [, year, month, day] = isoMatch;

  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function getStringField(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function isAzazieBridesmaidEvent(title: string, notes: string) {
  return /\bazazie\b/i.test(`${title} ${notes}`) && /\bbridesmaid|dress|fashion|pop[-\s]?up\b/i.test(`${title} ${notes}`);
}

function formatMeridiem(value: string) {
  return value.replace(/\./g, "").toUpperCase();
}

function extractPublicTime(notes: string) {
  const timeMatch = notes.match(
    /time:\s*(\d{1,2}:\d{2})\s*(a\.m\.|p\.m\.)\s*[-–]\s*(\d{1,2}:\d{2})\s*(a\.m\.|p\.m\.)/i,
  );

  if (!timeMatch) {
    return "";
  }

  const [, startTime, startMeridiem, endTime, endMeridiem] = timeMatch;

  return `${startTime} ${formatMeridiem(startMeridiem)} - ${endTime} ${formatMeridiem(endMeridiem)}`;
}

function isSafePublicNote(notes: string) {
  if (!notes.trim()) {
    return false;
  }

  return !/(admin|internal|private|payment|budget|cost|quote|invoice|deposit|balance|bank|follow[-\s]?up|vendor contact|phone|email|status|tasks?|purchase)/i.test(notes);
}

function normalizePublicEvent(value: unknown): PublicInnerCircleDate | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;

  if (record.type !== bridalPartyFashionType) {
    return null;
  }

  if ("showOnInnerCircle" in record && record.showOnInnerCircle !== true) {
    return null;
  }

  const date = normalizeDateValue(record.date);
  const title = getStringField(record, ["title"]);

  if (!date || !title) {
    return null;
  }

  const notes = getStringField(record, ["notes"]);
  const isAzazieEvent = isAzazieBridesmaidEvent(title, notes);
  const publicEvent: PublicInnerCircleDate = {
    id: getStringField(record, ["id"]) || `${date}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    title: isAzazieEvent ? "Azazie bridesmaid dress pop-up" : title,
    date,
  };
  const time = getStringField(record, ["time", "startTime"]) || (isAzazieEvent ? extractPublicTime(notes) : "");
  const location = getStringField(record, ["location"]);

  if (time) {
    publicEvent.time = time;
  }

  if (location) {
    publicEvent.location = location;
  }

  if (isAzazieEvent) {
    publicEvent.notes =
      "A relaxed try-on appointment for bridesmaid dress colours, fabrics, and fits. We'll confirm who needs to attend closer to the date.";
  } else if (isSafePublicNote(notes)) {
    publicEvent.notes = notes;
  }

  return publicEvent;
}

export async function GET(request: NextRequest) {
  const access = verifyInnerCircleApiRequest(request);

  if (!access.ok) {
    return access.response;
  }

  try {
    const { payload } = await readPrivatePlanningDataPayload();
    const planningPayload = payload as Record<string, unknown>;
    const rawEvents = Array.isArray(planningPayload.events) ? planningPayload.events : fallbackBridalPartyFashionEvents;
    const todayKey = toDateKeyInTimezone(new Date(), publicPlanningTimezone);
    const events = rawEvents
      .map(normalizePublicEvent)
      .filter((event): event is PublicInnerCircleDate => Boolean(event))
      .filter((event) => event.date >= todayKey)
      .sort((left, right) => left.date.localeCompare(right.date));

    return NextResponse.json(
      { ok: true, events },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Inner Circle bridal party dates load failed.", error);

    return NextResponse.json(
      { ok: false, events: [] },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
