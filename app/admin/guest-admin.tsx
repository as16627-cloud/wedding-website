"use client";

import { type FormEvent, useState } from "react";

type AdminGuest = {
  id: string;
  fullName: string;
  phoneNumber: string | null;
  email: string | null;
  side: string | null;
  notes: string | null;
  inviteToken: string;
  rsvpResponse: string;
  attendingCeremony: boolean | null;
  attendingReception: boolean | null;
  bringingPlusOne: boolean;
  plusOneName: string | null;
  dietaryRequirements: string | null;
  songRequest: string | null;
  message: string | null;
  respondedAt: string | null;
};

type GuestResponse = {
  ok?: boolean;
  error?: string;
  guest?: AdminGuest;
  guests?: AdminGuest[];
  summary?: {
    total: number;
    responded: number;
    notResponded: number;
  };
};

const ADMIN_SESSION_LABEL = "Sumaya & Aditya";

function formatAnswer(value: boolean | null) {
  if (value === null) {
    return "Not answered";
  }

  return value ? "Yes" : "No";
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not yet";
  }

  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function GuestAdmin() {
  const [passcode, setPasscode] = useState("");
  const [activePasscode, setActivePasscode] = useState("");
  const [guests, setGuests] = useState<AdminGuest[]>([]);
  const [summary, setSummary] = useState({ total: 0, responded: 0, notResponded: 0 });
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [copiedGuestId, setCopiedGuestId] = useState("");

  const unlocked = Boolean(activePasscode);

  function buildInviteLink(token: string) {
    if (typeof window === "undefined") {
      return `/?guest=${token}#rsvp`;
    }

    return `${window.location.origin}/?guest=${token}#rsvp`;
  }

  async function requestGuests(passcodeToUse = activePasscode) {
    setStatus("loading");
    setMessage("");

    const response = await fetch("/api/admin/guests", {
      headers: {
        "x-admin-passcode": passcodeToUse,
      },
    });
    const result = (await response.json()) as GuestResponse;

    if (!response.ok || !result.ok || !result.guests || !result.summary) {
      throw new Error(result.error ?? "Could not load guests.");
    }

    setGuests(result.guests);
    setSummary(result.summary);
    setStatus("idle");
  }

  async function handleUnlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await requestGuests(passcode);
      setActivePasscode(passcode);
      setPasscode("");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not unlock admin.");
    }
  }

  async function handleAddGuest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      setStatus("loading");
      setMessage("");

      const response = await fetch("/api/admin/guests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": activePasscode,
        },
        body: JSON.stringify({
          fullName: formData.get("fullName"),
          phoneNumber: formData.get("phoneNumber"),
          email: formData.get("email"),
          side: formData.get("side"),
          notes: formData.get("notes"),
        }),
      });
      const result = (await response.json()) as GuestResponse;

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Could not add guest.");
      }

      form.reset();
      await requestGuests();
      setStatus("success");
      setMessage("Guest added.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not add guest.");
    }
  }

  async function updateGuestStatus(guest: AdminGuest, rsvpResponse: string) {
    try {
      setStatus("loading");
      setMessage("");

      const response = await fetch("/api/admin/guests", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": activePasscode,
        },
        body: JSON.stringify({
          id: guest.id,
          rsvpResponse,
        }),
      });
      const result = (await response.json()) as GuestResponse;

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Could not update guest.");
      }

      await requestGuests();
      setStatus("success");
      setMessage("Guest updated.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not update guest.");
    }
  }

  async function deleteGuest(guest: AdminGuest) {
    try {
      setStatus("loading");
      setMessage("");

      const response = await fetch("/api/admin/guests", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-admin-passcode": activePasscode,
        },
        body: JSON.stringify({ id: guest.id }),
      });
      const result = (await response.json()) as GuestResponse;

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Could not delete guest.");
      }

      await requestGuests();
      setStatus("success");
      setMessage("Guest deleted.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not delete guest.");
    }
  }

  async function copyInviteLink(guest: AdminGuest) {
    const link = buildInviteLink(guest.inviteToken);
    await navigator.clipboard.writeText(link);
    setCopiedGuestId(guest.id);
    window.setTimeout(() => setCopiedGuestId(""), 1800);
  }

  if (!unlocked) {
    return (
      <main className="min-h-screen bg-[#fbf7f2] px-6 py-16 text-[#4f4641]">
        <section className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-xl flex-col items-center justify-center text-center">
          <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.42em] text-[#6e5b54]">
            {ADMIN_SESSION_LABEL}
          </p>
          <h1 className="rose-gold-foil font-serif text-5xl leading-tight md:text-6xl">Guest Admin</h1>
          <p className="mt-6 text-base leading-8 text-[#6a5d55]">
            Private guest list and RSVP dashboard for the wedding.
          </p>

          <form
            onSubmit={handleUnlock}
            className="mt-9 w-full rounded-[2rem] border border-[#eaded6] bg-[#fffaf7]/82 p-6 shadow-[0_18px_45px_rgba(90,65,50,0.07)] backdrop-blur md:p-8"
          >
            <label className="grid gap-3 text-left">
              <span className="text-[11px] font-medium uppercase tracking-[0.32em] text-[#6e5b54]">Passcode</span>
              <input
                type="password"
                value={passcode}
                onChange={(event) => setPasscode(event.target.value)}
                className="min-h-12 rounded-2xl border border-[#eaded6] bg-white/80 px-4 text-[#3f302b] outline-none transition duration-300 ease-out placeholder:text-[#a99790] focus:border-[#b98278]"
                placeholder="Enter passcode"
              />
            </label>

            {message && <p className="mt-4 text-left text-sm leading-6 text-[#9b6f68]">{message}</p>}

            <button
              type="submit"
              disabled={status === "loading"}
              className="mt-6 w-full rounded-full bg-[#241815] px-7 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white shadow-[0_12px_30px_rgba(36,24,21,0.18)] transition duration-300 ease-out hover:-translate-y-[1px] hover:bg-[#382722] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "loading" ? "Opening..." : "Enter"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbf7f2] px-6 py-12 text-[#4f4641] md:py-16">
      <section className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.42em] text-[#6e5b54]">Guest Admin</p>
          <h1 className="rose-gold-foil font-serif text-5xl leading-tight md:text-6xl">Guest List</h1>
          <p className="mx-auto mt-5 max-w-2xl text-[16px] leading-8 text-[#6a5d55]">
            Add guests, copy invite links for SMS, and see who has responded.
          </p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          {[
            ["Total guests", summary.total],
            ["Responded", summary.responded],
            ["Not responded", summary.notResponded],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[1.5rem] border border-[#eaded6] bg-[#fffaf7]/82 p-5 text-center">
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#8c7a72]">{label}</p>
              <p className="mt-3 font-serif text-4xl text-[#3f302b]">{value}</p>
            </div>
          ))}
        </div>

        <form
          onSubmit={handleAddGuest}
          className="mb-8 rounded-[2rem] border border-[#eaded6] bg-[#fffaf7]/82 p-6 shadow-[0_18px_45px_rgba(90,65,50,0.055)] md:p-8"
        >
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-[#8c7a72]">Add guest</p>
              <h2 className="mt-2 font-serif text-3xl text-[#3f302b]">Guest details</h2>
            </div>
            <button
              type="submit"
              disabled={status === "loading"}
              className="rounded-full bg-[#241815] px-6 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white shadow-[0_12px_30px_rgba(36,24,21,0.18)] transition duration-300 ease-out hover:-translate-y-[1px] hover:bg-[#382722] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Add guest
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <input name="fullName" placeholder="Full name" className="min-h-12 rounded-2xl border border-[#eaded6] bg-white/85 px-4 outline-none focus:border-[#b98278]" />
            <input name="phoneNumber" placeholder="Phone number for SMS" className="min-h-12 rounded-2xl border border-[#eaded6] bg-white/85 px-4 outline-none focus:border-[#b98278]" />
            <input name="email" placeholder="Email" className="min-h-12 rounded-2xl border border-[#eaded6] bg-white/85 px-4 outline-none focus:border-[#b98278]" />
            <input name="side" placeholder="Bride, groom, family, friend..." className="min-h-12 rounded-2xl border border-[#eaded6] bg-white/85 px-4 outline-none focus:border-[#b98278]" />
          </div>
          <textarea
            name="notes"
            rows={3}
            placeholder="Private notes"
            className="mt-4 w-full rounded-2xl border border-[#eaded6] bg-white/85 px-4 py-3 outline-none focus:border-[#b98278]"
          />
        </form>

        {message && (
          <div
            className={`mb-6 rounded-2xl border px-5 py-4 text-sm leading-6 ${
              status === "error"
                ? "border-[#e6c8c2] bg-[#fff4f2] text-[#8b5f58]"
                : "border-[#d8bd96] bg-[#fffaf7] text-[#5f524b]"
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid gap-5">
          {guests.map((guest) => {
            const inviteLink = buildInviteLink(guest.inviteToken);
            const smsBody = encodeURIComponent(`Hi ${guest.fullName}, please RSVP here: ${inviteLink}`);

            return (
              <article
                key={guest.id}
                className="rounded-[1.75rem] border border-[#eaded6] bg-[#fffaf7]/82 p-6 shadow-[0_14px_38px_rgba(90,65,50,0.045)]"
              >
                <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                  <div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-serif text-2xl text-[#3f302b]">{guest.fullName}</p>
                        <p className="mt-1 text-sm leading-6 text-[#6a5d55]">
                          {[guest.side, guest.phoneNumber, guest.email].filter(Boolean).join(" - ") || "No extra details"}
                        </p>
                      </div>
                      <span className="w-fit rounded-full border border-[#eaded6] bg-[#fbf7f2] px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-[#6e5b54]">
                        {guest.rsvpResponse}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-3 text-sm leading-6 text-[#5f524b] md:grid-cols-2">
                      <p>Ceremony: {formatAnswer(guest.attendingCeremony)}</p>
                      <p>Reception: {formatAnswer(guest.attendingReception)}</p>
                      <p>+1: {guest.bringingPlusOne ? guest.plusOneName ?? "Yes" : "No"}</p>
                      <p>Responded: {formatDate(guest.respondedAt)}</p>
                      {guest.dietaryRequirements && <p>Dietary: {guest.dietaryRequirements}</p>}
                      {guest.songRequest && <p>Song: {guest.songRequest}</p>}
                      {guest.notes && <p>Notes: {guest.notes}</p>}
                    </div>
                  </div>

                  <div className="grid content-start gap-3">
                    <label className="grid gap-2">
                      <span className="text-[11px] font-medium uppercase tracking-[0.26em] text-[#8c7a72]">
                        RSVP response
                      </span>
                      <select
                        value={guest.rsvpResponse}
                        onChange={(event) => updateGuestStatus(guest, event.target.value)}
                        className="min-h-12 rounded-2xl border border-[#eaded6] bg-white/85 px-4 outline-none focus:border-[#b98278]"
                      >
                        <option>Not responded</option>
                        <option>Responded</option>
                      </select>
                    </label>

                    <div className="rounded-2xl border border-[#eaded6] bg-[#fbf7f2] px-4 py-3 text-xs leading-6 text-[#6a5d55]">
                      {inviteLink}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => copyInviteLink(guest)}
                        className="rounded-full border border-[#eaded6] bg-white/70 px-5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#3f302b] transition hover:border-[#d8bd96]"
                      >
                        {copiedGuestId === guest.id ? "Copied" : "Copy link"}
                      </button>
                      {guest.phoneNumber && (
                        <a
                          href={`sms:${guest.phoneNumber}?&body=${smsBody}`}
                          className="rounded-full border border-[#eaded6] bg-white/70 px-5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#3f302b] transition hover:border-[#d8bd96]"
                        >
                          SMS
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteGuest(guest)}
                        className="rounded-full border border-[#e6c8c2] bg-[#fff4f2] px-5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#7f554f] transition hover:border-[#d8a79e]"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
