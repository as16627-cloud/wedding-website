"use client";

import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Heart, Loader2 } from "lucide-react";

type PublicGuest = {
  fullName: string;
  rsvpStatus: string;
  invitedToCeremony: boolean;
  invitedToReception: boolean;
  plusOneAllowed: boolean;
  ceremonyResponse: boolean | null;
  receptionResponse: boolean | null;
  plusOneResponse: boolean | null;
  plusOneName: string | null;
  guestDietary: string | null;
  plusOneDietary: string | null;
  songRequest: string | null;
  guestMessage: string | null;
  respondedAt: string | null;
};

type LookupResponse = {
  ok?: boolean;
  error?: string;
  guest?: PublicGuest;
};

type SubmitResponse = LookupResponse & {
  message?: string;
};

type YesNo = "" | "yes" | "no";

function answerLabel(value: boolean | null | undefined) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "Not answered";
}

function yesNoToBoolean(value: YesNo) {
  if (value === "yes") return true;
  if (value === "no") return false;
  return null;
}

function booleanToYesNo(value: boolean | null): YesNo {
  if (value === true) return "yes";
  if (value === false) return "no";
  return "";
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7b6760]">{children}</span>;
}

function RadioGroup({
  legend,
  name,
  value,
  onChange,
}: {
  legend: string;
  name: string;
  value: YesNo;
  onChange: (value: YesNo) => void;
}) {
  return (
    <fieldset className="rounded-2xl border border-[#eaded6] bg-white/72 p-5">
      <legend className="px-1">
        <FieldLabel>{legend}</FieldLabel>
      </legend>
      <div className="mt-4 grid gap-3 text-sm text-[#4f4641]">
        {(["yes", "no"] as const).map((option) => (
          <label key={option} className="flex items-center gap-3">
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              className="accent-[#b98278]"
            />
            {option === "yes" ? "Yes" : "No"}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function TextArea({
  label,
  name,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="grid gap-2">
      <FieldLabel>{label}</FieldLabel>
      <textarea
        name={name}
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-2xl border border-[#eaded6] bg-white px-4 py-3 text-[#4f4641] outline-none transition placeholder:text-[#a99790] focus:border-[#b98278]"
      />
    </label>
  );
}

export default function TokenRsvpForm({ token }: { token: string }) {
  const [guest, setGuest] = useState<PublicGuest | null>(null);
  const [ceremonyResponse, setCeremonyResponse] = useState<YesNo>("");
  const [receptionResponse, setReceptionResponse] = useState<YesNo>("");
  const [plusOneResponse, setPlusOneResponse] = useState<YesNo>("");
  const [plusOneName, setPlusOneName] = useState("");
  const [guestDietary, setGuestDietary] = useState("");
  const [plusOneDietary, setPlusOneDietary] = useState("");
  const [songRequest, setSongRequest] = useState("");
  const [guestMessage, setGuestMessage] = useState("");
  const [status, setStatus] = useState<"loading" | "idle" | "submitting" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadGuest() {
      try {
        setStatus("loading");
        setMessage("");

        const response = await fetch("/api/rsvp/lookup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });
        const result = (await response.json()) as LookupResponse;

        if (!active) return;

        if (!response.ok || !result.ok || !result.guest) {
          throw new Error(result.error ?? "We could not find this RSVP link.");
        }

        setGuest(result.guest);
        setCeremonyResponse(booleanToYesNo(result.guest.ceremonyResponse));
        setReceptionResponse(booleanToYesNo(result.guest.receptionResponse));
        setPlusOneResponse(booleanToYesNo(result.guest.plusOneResponse));
        setPlusOneName(result.guest.plusOneName ?? "");
        setGuestDietary(result.guest.guestDietary ?? "");
        setPlusOneDietary(result.guest.plusOneDietary ?? "");
        setSongRequest(result.guest.songRequest ?? "");
        setGuestMessage(result.guest.guestMessage ?? "");
        setStatus("idle");
      } catch (error) {
        if (!active) return;
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "We could not find this RSVP link.");
      }
    }

    void loadGuest();

    return () => {
      active = false;
    };
  }, [token]);

  const invitationSummary = useMemo(() => {
    const parts = [];
    if (guest?.invitedToCeremony) parts.push("Ceremony");
    if (guest?.invitedToReception) parts.push("Reception");
    if (guest?.plusOneAllowed) parts.push("Plus one welcome");
    return parts.join(" · ");
  }, [guest]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!guest) return;

    if (guest.invitedToCeremony && !ceremonyResponse) {
      setStatus("error");
      setMessage("Please answer the ceremony attendance question.");
      return;
    }

    if (guest.invitedToReception && !receptionResponse) {
      setStatus("error");
      setMessage("Please answer the reception attendance question.");
      return;
    }

    if (guest.plusOneAllowed && !plusOneResponse) {
      setStatus("error");
      setMessage("Please answer the plus-one question.");
      return;
    }

    if (plusOneResponse === "yes" && !plusOneName.trim()) {
      setStatus("error");
      setMessage("Please enter your plus-one's full name.");
      return;
    }

    try {
      setStatus("submitting");
      setMessage("");

      const response = await fetch("/api/rsvp/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          ceremonyResponse: yesNoToBoolean(ceremonyResponse),
          receptionResponse: yesNoToBoolean(receptionResponse),
          plusOneResponse: yesNoToBoolean(plusOneResponse),
          plusOneName: plusOneResponse === "yes" ? plusOneName.trim() : "",
          guestDietary,
          plusOneDietary: plusOneResponse === "yes" ? plusOneDietary : "",
          songRequest,
          guestMessage,
        }),
      });
      const result = (await response.json()) as SubmitResponse;

      if (!response.ok || !result.ok || !result.guest) {
        throw new Error(result.error ?? "Something went wrong while saving your RSVP.");
      }

      setGuest(result.guest);
      setStatus("success");
      setMessage(result.message ?? "Thank you. Your RSVP has been saved.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong while saving your RSVP.");
    }
  }

  return (
    <main className="min-h-screen bg-[#fbf7f2] px-5 py-10 text-[#4f4641] md:px-8 md:py-14">
      <section className="mx-auto max-w-4xl">
        <div className="mb-9 text-center">
          <Link href="/" className="text-[11px] font-medium uppercase tracking-[0.28em] text-[#8c7a72]">
            Sumaya &amp; Aditya
          </Link>
          <h1 className="mt-4 font-serif text-[48px] leading-none text-[#b58b84] md:text-[68px]">RSVP</h1>
          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-7 text-[#6a5d55]">
            A private RSVP page for your invitation.
          </p>
        </div>

        <div className="rounded-[2.25rem] border border-[#eaded6] bg-[#fffaf7]/86 p-6 shadow-[0_22px_60px_rgba(90,65,50,0.08)] md:p-9">
          {status === "loading" && (
            <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
              <Loader2 aria-hidden="true" className="h-7 w-7 animate-spin text-[#b98278]" />
              <p className="mt-5 text-sm uppercase tracking-[0.22em] text-[#7d6b62]">Opening your invitation</p>
            </div>
          )}

          {status === "error" && !guest && (
            <div className="mx-auto max-w-xl py-12 text-center">
              <Heart aria-hidden="true" className="mx-auto h-8 w-8 text-[#b98278]" />
              <h2 className="mt-5 font-serif text-3xl text-[#3f302b]">We could not find this RSVP</h2>
              <p className="mt-4 leading-7 text-[#6a5d55]">{message}</p>
            </div>
          )}

          {guest && status === "success" && (
            <div className="mx-auto max-w-2xl py-8 text-center">
              <CheckCircle2 aria-hidden="true" className="mx-auto h-10 w-10 text-[#6f7d5b]" />
              <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8c7a72]">
                RSVP received
              </p>
              <h2 className="mt-3 font-serif text-4xl text-[#3f302b]">Thank you, {guest.fullName}</h2>
              <p className="mx-auto mt-4 max-w-xl leading-7 text-[#6a5d55]">{message}</p>

              <div className="mt-8 grid gap-3 rounded-2xl border border-[#eaded6] bg-[#fbf7f2]/80 p-5 text-left text-sm leading-6 text-[#5f524b]">
                {guest.invitedToCeremony && <p>Ceremony: {answerLabel(guest.ceremonyResponse)}</p>}
                {guest.invitedToReception && <p>Reception: {answerLabel(guest.receptionResponse)}</p>}
                {guest.plusOneAllowed && (
                  <p>
                    Plus one: {answerLabel(guest.plusOneResponse)}
                    {guest.plusOneResponse ? ` · ${guest.plusOneName}` : ""}
                  </p>
                )}
                {guest.guestDietary && <p>Dietary: {guest.guestDietary}</p>}
                {guest.plusOneDietary && <p>Plus-one dietary: {guest.plusOneDietary}</p>}
                {guest.songRequest && <p>Song request: {guest.songRequest}</p>}
              </div>
            </div>
          )}

          {guest && status !== "loading" && status !== "success" && (
            <form onSubmit={handleSubmit} className="grid gap-7">
              <div className="text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8c7a72]">Welcome</p>
                <h2 className="mt-3 font-serif text-4xl text-[#3f302b]">Welcome, {guest.fullName}</h2>
                {invitationSummary && (
                  <p className="mt-4 text-sm uppercase tracking-[0.18em] text-[#9b6f68]">{invitationSummary}</p>
                )}
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {guest.invitedToCeremony && (
                  <RadioGroup
                    legend="Will you be joining us for the ceremony?"
                    name="ceremonyResponse"
                    value={ceremonyResponse}
                    onChange={setCeremonyResponse}
                  />
                )}

                {guest.invitedToReception && (
                  <RadioGroup
                    legend="Will you be joining us for the reception?"
                    name="receptionResponse"
                    value={receptionResponse}
                    onChange={setReceptionResponse}
                  />
                )}
              </div>

              {guest.plusOneAllowed && (
                <fieldset className="rounded-2xl border border-[#eaded6] bg-white/72 p-5">
                  <legend className="px-1">
                    <FieldLabel>Will you be bringing a plus one?</FieldLabel>
                  </legend>
                  <div className="mt-4 grid gap-3 text-sm text-[#4f4641]">
                    {(["yes", "no"] as const).map((option) => (
                      <label key={option} className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="plusOneResponse"
                          value={option}
                          checked={plusOneResponse === option}
                          onChange={() => {
                            setPlusOneResponse(option);
                            if (option === "no") {
                              setPlusOneName("");
                              setPlusOneDietary("");
                            }
                          }}
                          className="accent-[#b98278]"
                        />
                        {option === "yes" ? "Yes" : "No"}
                      </label>
                    ))}
                  </div>

                  {plusOneResponse === "yes" && (
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <label className="grid gap-2">
                        <FieldLabel>Plus-one full name</FieldLabel>
                        <input
                          type="text"
                          value={plusOneName}
                          onChange={(event) => setPlusOneName(event.target.value)}
                          placeholder="Their full name"
                          className="min-h-12 rounded-2xl border border-[#eaded6] bg-white/85 px-4 text-[#4f4641] outline-none transition placeholder:text-[#a99790] focus:border-[#b98278]"
                        />
                      </label>
                      <TextArea
                        label="Plus-one dietary"
                        name="plusOneDietary"
                        value={plusOneDietary}
                        onChange={setPlusOneDietary}
                        placeholder="Any allergies or dietary requirements"
                      />
                    </div>
                  )}
                </fieldset>
              )}

              <TextArea
                label="Your dietary requirements"
                name="guestDietary"
                value={guestDietary}
                onChange={setGuestDietary}
                placeholder="Please let us know about any allergies or dietary requirements"
              />

              <label className="grid gap-2">
                <FieldLabel>Song request</FieldLabel>
                <input
                  type="text"
                  value={songRequest}
                  onChange={(event) => setSongRequest(event.target.value)}
                  placeholder="A song you would love to hear on the dance floor"
                  className="min-h-12 rounded-2xl border border-[#eaded6] bg-white px-4 text-[#4f4641] outline-none transition placeholder:text-[#a99790] focus:border-[#b98278]"
                />
              </label>

              <TextArea
                label="Message for us"
                name="guestMessage"
                value={guestMessage}
                onChange={setGuestMessage}
                placeholder="A note, question, or anything you would like us to know"
              />

              {message && (
                <div className="rounded-2xl border border-[#e6c8c2] bg-[#fff4f2] px-5 py-4 text-sm leading-6 text-[#8b5f58]">
                  {message}
                </div>
              )}

              <div className="flex flex-col gap-3 border-t border-[#eaded6] pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-6 text-[#7b6760]">
                  Your response will update your invitation in our wedding guest list.
                </p>
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="rounded-full bg-[#241815] px-7 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-[0_12px_30px_rgba(36,24,21,0.18)] transition duration-300 ease-out hover:-translate-y-[1px] hover:bg-[#382722] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status === "submitting" ? "Saving..." : "Submit RSVP"}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
