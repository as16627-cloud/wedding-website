"use client";

import { type ChangeEvent, type FormEvent, type ReactNode, useEffect, useId, useMemo, useState } from "react";
import {
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  Copy,
  Download,
  ExternalLink,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  Upload,
  UsersRound,
  X,
} from "lucide-react";

const PRIVATE_PLANNING_GUESTS_ENDPOINT = "/api/private-planning/guests";
const PRIVATE_PLANNING_CSRF_HEADER = "x-private-planning-csrf";

type CoupleGuest = {
  id: string;
  fullName: string;
  phoneNumber: string | null;
  email: string | null;
  side: string | null;
  notes: string | null;
  householdName: string | null;
  householdAddress: string | null;
  householdNotes: string | null;
  inviteToken: string;
  rsvpToken: string;
  invitedToCeremony: boolean;
  invitedToReception: boolean;
  plusOneAllowed: boolean;
  smsSentAt: string | null;
  rsvpLinkSentAt: string | null;
  lastContactedAt: string | null;
  lastMessageType: string | null;
  rsvpResponse: RsvpStatus;
  rsvpStatus: RsvpStatus;
  attendingCeremony: boolean | null;
  attendingReception: boolean | null;
  bringingPlusOne: boolean;
  ceremonyResponse: boolean | null;
  receptionResponse: boolean | null;
  plusOneResponse: boolean | null;
  plusOneName: string | null;
  dietaryRequirements: string | null;
  guestDietary: string | null;
  plusOneDietary: string | null;
  songRequest: string | null;
  message: string | null;
  guestMessage: string | null;
  respondedAt: string | null;
  updatedAt: string;
};

type GuestSummary = {
  total: number;
  headcount: number;
  responded: number;
  notResponded: number;
  ceremonyYes: number;
  receptionYes: number;
  plusOnes: number;
  dietaryNotes: number;
  noPhone: number;
  smsNotSent: number;
};

type GuestListResponse = {
  ok?: boolean;
  error?: string;
  guest?: CoupleGuest;
  guests?: CoupleGuest[];
  summary?: GuestSummary;
};

type RsvpStatus = "Responded" | "Not responded";
type AttendanceValue = "Not answered" | "Yes" | "No";

type GuestForm = {
  fullName: string;
  phoneNumber: string;
  email: string;
  side: string;
  notes: string;
  householdName: string;
  householdAddress: string;
  householdNotes: string;
  invitedToCeremony: "Yes" | "No";
  invitedToReception: "Yes" | "No";
  plusOneAllowed: "Yes" | "No";
  rsvpResponse: RsvpStatus;
  attendingCeremony: AttendanceValue;
  attendingReception: AttendanceValue;
  bringingPlusOne: "Yes" | "No";
  plusOneName: string;
  dietaryRequirements: string;
  songRequest: string;
  message: string;
};

const emptySummary: GuestSummary = {
  total: 0,
  headcount: 0,
  responded: 0,
  notResponded: 0,
  ceremonyYes: 0,
  receptionYes: 0,
  plusOnes: 0,
  dietaryNotes: 0,
  noPhone: 0,
  smsNotSent: 0,
};

const emptyGuestForm: GuestForm = {
  fullName: "",
  phoneNumber: "",
  email: "",
  side: "",
  notes: "",
  householdName: "",
  householdAddress: "",
  householdNotes: "",
  invitedToCeremony: "Yes",
  invitedToReception: "Yes",
  plusOneAllowed: "No",
  rsvpResponse: "Not responded",
  attendingCeremony: "Not answered",
  attendingReception: "Not answered",
  bringingPlusOne: "No",
  plusOneName: "",
  dietaryRequirements: "",
  songRequest: "",
  message: "",
};

const quickFilters = [
  "All",
  "Waiting",
  "Responded",
  "Attending",
  "Declined",
  "Ceremony",
  "Reception",
  "Plus ones",
  "Dietary",
  "Missing contact info",
  "Bride side",
  "Groom side",
  "Needs follow-up",
  "Potential duplicates",
] as const;
const attendanceOptions: AttendanceValue[] = ["Not answered", "Yes", "No"];
const messageTemplates = [
  "Save the date reminder",
  "RSVP reminder",
  "Dietary details request",
  "Accommodation/transport reminder",
  "Thank you / confirmation",
] as const;

type QuickFilter = (typeof quickFilters)[number];
type MessageTemplate = (typeof messageTemplates)[number];
type DrawerMode = "closed" | "add" | "edit" | "import";

const guestFieldLabelClass = "text-[10px] font-medium uppercase tracking-[0.22em] text-[#8c7a72]";
const guestInputClass =
  "min-h-12 rounded-[1.05rem] border border-[#eaded6]/80 bg-white/82 px-4 text-sm text-[#3f302b] shadow-[inset_0_1px_0_rgba(255,255,255,0.42)] outline-none transition duration-300 ease-out hover:border-[#dcc9bf] focus:border-[#b98278] focus:bg-white focus:shadow-[0_0_0_3px_rgba(185,130,120,0.08)]";
const guestTextareaClass =
  "min-h-[5.25rem] rounded-[1.05rem] border border-[#eaded6]/80 bg-white/82 px-4 py-3 text-sm leading-6 text-[#3f302b] shadow-[inset_0_1px_0_rgba(255,255,255,0.42)] outline-none transition-[min-height,border-color,box-shadow,background-color] duration-300 ease-out hover:border-[#dcc9bf] focus:min-h-[7rem] focus:border-[#b98278] focus:bg-white focus:shadow-[0_0_0_3px_rgba(185,130,120,0.08)]";
const guestSecondaryButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#eaded6] bg-white/72 px-5 text-xs font-semibold uppercase tracking-[0.13em] text-[#3f302b] transition duration-300 ease-out hover:border-[#d8bd96] hover:bg-white disabled:cursor-not-allowed disabled:opacity-60";
const guestPrimaryButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--color-navy)] px-5 text-xs font-semibold uppercase tracking-[0.13em] text-[var(--color-cta-text)] shadow-[0_10px_24px_rgba(20,26,44,0.16)] transition duration-300 ease-out hover:bg-[var(--color-navy-hover)] disabled:cursor-not-allowed disabled:opacity-60";

function booleanToAttendance(value: boolean | null): AttendanceValue {
  if (value === null) {
    return "Not answered";
  }

  return value ? "Yes" : "No";
}

function attendanceToBody(value: AttendanceValue) {
  return value === "Not answered" ? null : value;
}

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

function getGuestStatus(guest: CoupleGuest): RsvpStatus {
  return guest.rsvpStatus ?? guest.rsvpResponse;
}

function getCeremonyResponse(guest: CoupleGuest) {
  return guest.ceremonyResponse ?? guest.attendingCeremony;
}

function getReceptionResponse(guest: CoupleGuest) {
  return guest.receptionResponse ?? guest.attendingReception;
}

function getPlusOneResponse(guest: CoupleGuest) {
  return guest.plusOneResponse ?? guest.bringingPlusOne;
}

function getDietaryNotes(guest: CoupleGuest) {
  return [guest.guestDietary ?? guest.dietaryRequirements, guest.plusOneDietary].filter(Boolean).join(" / ");
}

function normalizePhone(value: string | null) {
  return value?.replace(/[^\d+]/g, "") ?? "";
}

function normalizeComparison(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ");
}

function getHouseholdName(guest: CoupleGuest) {
  return guest.householdName?.trim() || "Ungrouped household";
}

function hasMissingContact(guest: CoupleGuest) {
  return !guest.phoneNumber || !guest.email;
}

function needsFollowUp(guest: CoupleGuest) {
  return getGuestStatus(guest) !== "Responded" || hasMissingContact(guest) || (guest.plusOneAllowed && getPlusOneResponse(guest) === true && !guest.plusOneName);
}

function buildInviteLink(siteUrl: string, inviteToken: string) {
  const baseUrl = siteUrl || "";
  return `${baseUrl}/rsvp/${encodeURIComponent(inviteToken)}`;
}

function buildInviteMessage(fullName: string, inviteLink: string, template: MessageTemplate) {
  if (template === "RSVP reminder") {
    return `Hi ${fullName}, a gentle reminder to RSVP for Sumaya and Aditya's wedding here: ${inviteLink}`;
  }

  if (template === "Dietary details request") {
    return `Hi ${fullName}, could you please confirm any dietary details for Sumaya and Aditya's wedding here: ${inviteLink}`;
  }

  if (template === "Accommodation/transport reminder") {
    return `Hi ${fullName}, sharing the RSVP link for Sumaya and Aditya's wedding so we can keep accommodation and transport notes together: ${inviteLink}`;
  }

  if (template === "Thank you / confirmation") {
    return `Hi ${fullName}, thank you for your RSVP for Sumaya and Aditya's wedding. You can review your details here: ${inviteLink}`;
  }

  return `Hi ${fullName}, please RSVP for Sumaya and Aditya's wedding here: ${inviteLink}`;
}

function buildSmsHref(phoneNumber: string | null, message: string) {
  const phone = normalizePhone(phoneNumber);
  return `sms:${phone}?&body=${encodeURIComponent(message)}`;
}

function formFromGuest(guest: CoupleGuest): GuestForm {
  return {
    fullName: guest.fullName,
    phoneNumber: guest.phoneNumber ?? "",
    email: guest.email ?? "",
    side: guest.side ?? "",
    notes: guest.notes ?? "",
    householdName: guest.householdName ?? "",
    householdAddress: guest.householdAddress ?? "",
    householdNotes: guest.householdNotes ?? "",
    invitedToCeremony: guest.invitedToCeremony ? "Yes" : "No",
    invitedToReception: guest.invitedToReception ? "Yes" : "No",
    plusOneAllowed: guest.plusOneAllowed ? "Yes" : "No",
    rsvpResponse: getGuestStatus(guest),
    attendingCeremony: booleanToAttendance(getCeremonyResponse(guest)),
    attendingReception: booleanToAttendance(getReceptionResponse(guest)),
    bringingPlusOne: getPlusOneResponse(guest) ? "Yes" : "No",
    plusOneName: guest.plusOneName ?? "",
    dietaryRequirements: guest.guestDietary ?? guest.dietaryRequirements ?? "",
    songRequest: guest.songRequest ?? "",
    message: guest.guestMessage ?? guest.message ?? "",
  };
}

function formToBody(form: GuestForm) {
  return {
    ...form,
    invitedToCeremony: form.invitedToCeremony === "Yes",
    invitedToReception: form.invitedToReception === "Yes",
    plusOneAllowed: form.plusOneAllowed === "Yes",
    attendingCeremony: attendanceToBody(form.attendingCeremony),
    attendingReception: attendanceToBody(form.attendingReception),
    bringingPlusOne: form.bringingPlusOne === "Yes",
    plusOneName: form.bringingPlusOne === "Yes" ? form.plusOneName : "",
  };
}

function escapeCsvCell(value: string | number | boolean | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadGuestCsv(filename: string, guests: CoupleGuest[]) {
  const headers = [
    "Name",
    "Household",
    "Phone",
    "Email",
    "Side",
    "RSVP",
    "Ceremony",
    "Reception",
    "Plus one",
    "Plus one name",
    "Dietary",
    "Last contacted",
    "Notes",
  ];
  const rows = guests.map((guest) => [
    guest.fullName,
    getHouseholdName(guest),
    guest.phoneNumber,
    guest.email,
    guest.side,
    getGuestStatus(guest),
    formatAnswer(getCeremonyResponse(guest)),
    formatAnswer(getReceptionResponse(guest)),
    getPlusOneResponse(guest) ? "Yes" : "No",
    guest.plusOneName,
    getDietaryNotes(guest),
    guest.lastContactedAt ? formatDate(guest.lastContactedAt) : "",
    guest.notes,
  ]);
  const csv = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function parseGuestCsv(text: string) {
  const rows: string[][] = [];
  let cell = "";
  let row: string[] = [];
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);

  return rows;
}

function mapCsvGuestRows(rows: string[][]): GuestForm[] {
  const [headers = [], ...dataRows] = rows;
  const normalizedHeaders = headers.map((header) => normalizeComparison(header));
  const read = (row: string[], names: string[]) => {
    const index = normalizedHeaders.findIndex((header) => names.some((name) => header === normalizeComparison(name)));
    return index >= 0 ? row[index] ?? "" : "";
  };

  return dataRows
    .map((row) => ({
      ...emptyGuestForm,
      fullName: read(row, ["name", "full name", "guest", "guest name"]),
      householdName: read(row, ["household", "household name", "family"]),
      phoneNumber: read(row, ["phone", "phone number", "mobile"]),
      email: read(row, ["email", "email address"]),
      side: read(row, ["side"]),
      notes: read(row, ["notes", "private notes"]),
      dietaryRequirements: read(row, ["dietary", "dietary requirements", "allergies"]),
      plusOneName: read(row, ["plus one name", "plus-one name"]),
      plusOneAllowed: read(row, ["plus one allowed", "plus one"]) ? ("Yes" as const) : ("No" as const),
    }))
    .filter((guest) => guest.fullName.trim());
}

function SummaryTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "warm" | "sage";
}) {
  const toneClass =
    tone === "sage"
      ? "border-[#d7ded0] bg-[#f5f8f0]"
      : tone === "warm"
        ? "border-[#ead8cc] bg-[#fff7f0]"
        : "border-[#eaded6] bg-[#fffaf7]";

  return (
    <div className={`rounded-2xl border px-5 py-4 ${toneClass}`}>
      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#75675f]">{label}</p>
      <p className="mt-3 font-serif text-4xl leading-none text-[#3f302b]">{value}</p>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="grid gap-2.5">
      <span className={guestFieldLabelClass}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={guestInputClass}
        placeholder={placeholder}
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2.5">
      <span className={guestFieldLabelClass}>{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={2}
        className={guestTextareaClass}
        placeholder={placeholder}
      />
    </label>
  );
}

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  return (
    <label className="grid gap-2.5">
      <span className={guestFieldLabelClass}>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className={`${guestInputClass} appearance-none bg-[linear-gradient(45deg,transparent_50%,#9c7a73_50%),linear-gradient(135deg,#9c7a73_50%,transparent_50%)] bg-[length:6px_6px,6px_6px] bg-[position:calc(100%-20px)_52%,calc(100%-14px)_52%] bg-no-repeat pr-10`}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function GuestFormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.35rem] border border-[#eaded6]/58 bg-white/38 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.42)] sm:p-5">
      <p className="heading-micro text-[#8c7a72]">{title}</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

function GuestEditor({
  form,
  title,
  submitLabel,
  busy,
  onChange,
  onSubmit,
  onCancel,
}: {
  form: GuestForm;
  title: string;
  submitLabel: string;
  busy: boolean;
  onChange: <K extends keyof GuestForm>(key: K, value: GuestForm[K]) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel?: () => void;
}) {
  const [additionalDetailsOpen, setAdditionalDetailsOpen] = useState(false);
  const additionalDetailsId = useId();
  const isEditMode = submitLabel === "Save";
  const helperText = isEditMode
    ? "Update this guest profile, RSVPs, and household details privately."
    : "Create a guest profile, manage RSVPs, and organise household details privately.";
  const actionLabel = busy ? "Saving..." : submitLabel;
  const submitIcon = isEditMode ? <Save aria-hidden="true" className="h-4 w-4" /> : <Plus aria-hidden="true" className="h-4 w-4" />;
  const cancelButton = onCancel ? (
    <button
      type="button"
      onClick={onCancel}
      className={guestSecondaryButtonClass}
    >
      <X aria-hidden="true" className="h-4 w-4" />
      Cancel
    </button>
  ) : null;
  const submitButton = (
    <button
      type="submit"
      disabled={busy}
      className={guestPrimaryButtonClass}
    >
      {submitIcon}
      {actionLabel}
    </button>
  );

  return (
    <form onSubmit={onSubmit} className="min-h-full bg-[#fbf7f2]">
      <div className="flex min-h-full flex-col">
        <header className="border-b border-[#eaded6]/70 bg-[#fbf7f2]/96 px-5 pb-6 pt-6 sm:px-7 sm:pt-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="heading-micro">Guest Profile</p>
              <h2 className="heading-secondary heading-secondary-compact mt-2">{title}</h2>
              <p className="mt-3 max-w-[34rem] text-sm leading-7 text-[#6a5d55]">{helperText}</p>
            </div>
            <div className="hidden shrink-0 flex-wrap justify-end gap-3 sm:flex">
              {cancelButton}
              {submitButton}
            </div>
          </div>
        </header>

        <div className="flex-1 space-y-5 px-5 py-6 pb-28 sm:px-7 sm:py-7 sm:pb-8">
          <GuestFormSection title="Guest Identity">
            <TextField label="Full name" value={form.fullName} onChange={(value) => onChange("fullName", value)} />
            <TextField label="Household" value={form.householdName} onChange={(value) => onChange("householdName", value)} placeholder="The Sharma Family" />
            <TextField label="Side" value={form.side} onChange={(value) => onChange("side", value)} placeholder="Bride, groom, family..." />
          </GuestFormSection>

          <GuestFormSection title="Attendance">
            <SelectField
              label="RSVP"
              value={form.rsvpResponse}
              options={["Not responded", "Responded"] as const}
              onChange={(value) => onChange("rsvpResponse", value)}
            />
            <SelectField
              label="Ceremony"
              value={form.attendingCeremony}
              options={attendanceOptions}
              onChange={(value) => onChange("attendingCeremony", value)}
            />
            <SelectField
              label="Reception"
              value={form.attendingReception}
              options={attendanceOptions}
              onChange={(value) => onChange("attendingReception", value)}
            />
            <SelectField
              label="Plus one allowed"
              value={form.plusOneAllowed}
              options={["No", "Yes"] as const}
              onChange={(value) => onChange("plusOneAllowed", value)}
            />
          </GuestFormSection>

          <section className="overflow-hidden rounded-[1.35rem] border border-[#eaded6]/58 bg-white/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.42)]">
            <button
              type="button"
              aria-expanded={additionalDetailsOpen}
              aria-controls={additionalDetailsId}
              onClick={() => setAdditionalDetailsOpen((current) => !current)}
              className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition duration-300 ease-out hover:bg-white/28 sm:px-5"
            >
              <span>
                <span className="heading-micro block text-[#8c7a72]">Additional Details</span>
                <span className="mt-1 block text-sm leading-6 text-[#6a5d55]">Contact information, notes, dietary details, and messages.</span>
              </span>
              <ChevronDown
                aria-hidden="true"
                className={`h-4 w-4 shrink-0 text-[#9b6f68] transition duration-500 ease-out ${additionalDetailsOpen ? "rotate-180" : ""}`}
              />
            </button>

            <div
              id={additionalDetailsId}
              aria-hidden={!additionalDetailsOpen}
              inert={!additionalDetailsOpen ? true : undefined}
              className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                additionalDetailsOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div className="space-y-5 border-t border-[#eaded6]/50 px-4 py-5 sm:px-5">
                  <GuestFormSection title="Contact Details">
                    <TextField label="Phone" value={form.phoneNumber} onChange={(value) => onChange("phoneNumber", value)} />
                    <TextField label="Email" type="email" value={form.email} onChange={(value) => onChange("email", value)} />
                    <TextField label="Household address" value={form.householdAddress} onChange={(value) => onChange("householdAddress", value)} placeholder="Mailing address" />
                  </GuestFormSection>

                  <GuestFormSection title="Notes">
                    <SelectField
                      label="Plus one"
                      value={form.bringingPlusOne}
                      options={["No", "Yes"] as const}
                      onChange={(value) => onChange("bringingPlusOne", value)}
                    />
                    {form.bringingPlusOne === "Yes" && (
                      <TextField label="Plus one name" value={form.plusOneName} onChange={(value) => onChange("plusOneName", value)} />
                    )}
                    <TextField
                      label="Dietary"
                      value={form.dietaryRequirements}
                      onChange={(value) => onChange("dietaryRequirements", value)}
                      placeholder="Allergies or dietary requirements"
                    />
                    <TextField label="Song" value={form.songRequest} onChange={(value) => onChange("songRequest", value)} />
                    <TextAreaField label="Guest message" value={form.message} onChange={(value) => onChange("message", value)} />
                    <TextAreaField label="Private notes" value={form.notes} onChange={(value) => onChange("notes", value)} />
                    <TextAreaField label="Household notes" value={form.householdNotes} onChange={(value) => onChange("householdNotes", value)} />
                  </GuestFormSection>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="sticky bottom-0 z-10 border-t border-[#eaded6]/70 bg-[#fbf7f2]/92 px-5 py-4 shadow-[0_-16px_34px_rgba(80,60,55,0.08)] backdrop-blur-xl sm:hidden">
          <div className="grid grid-cols-2 gap-3">
            {cancelButton}
            {submitButton}
          </div>
        </div>
      </div>
    </form>
  );
}

function StatusBadge({ children, tone = "neutral" }: { children: string; tone?: "neutral" | "good" | "warn" | "rose" }) {
  const toneClass =
    tone === "good"
      ? "bg-[#eef5e9] text-[#52634a]"
      : tone === "warn"
        ? "bg-[#fff2e8] text-[#8a6758]"
        : tone === "rose"
          ? "bg-[#f8e8e4] text-[#9b6f68]"
          : "bg-[#f4ebe4] text-[#6a5d55]";

  return <span className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${toneClass}`}>{children}</span>;
}

function InlineTextControl({
  value,
  label,
  placeholder,
  onSave,
}: {
  value: string | null;
  label: string;
  placeholder?: string;
  onSave: (value: string) => void;
}) {
  return (
    <input
      key={value ?? ""}
      aria-label={label}
      defaultValue={value ?? ""}
      placeholder={placeholder}
      onBlur={(event) => {
        const nextValue = event.currentTarget.value.trim();
        if (nextValue !== (value ?? "")) onSave(nextValue);
      }}
      className="min-h-9 w-full min-w-32 rounded-xl border border-transparent bg-white/64 px-3 text-sm text-[#3f302b] outline-none transition hover:border-[#eaded6] focus:border-[#b98278]"
    />
  );
}

function InlineSelectControl<T extends string>({
  value,
  label,
  options,
  onSave,
}: {
  value: T;
  label: string;
  options: readonly T[];
  onSave: (value: T) => void;
}) {
  return (
    <select
      key={value}
      aria-label={label}
      defaultValue={value}
      onChange={(event) => onSave(event.currentTarget.value as T)}
      className="min-h-9 w-full min-w-28 rounded-xl border border-[#eaded6] bg-white/70 px-3 text-xs font-medium uppercase tracking-[0.08em] text-[#3f302b] outline-none transition focus:border-[#b98278]"
    >
      {options.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </select>
  );
}

export default function PrivatePlanningGuestsTab() {
  const [copiedGuestId, setCopiedGuestId] = useState("");
  const [guests, setGuests] = useState<CoupleGuest[]>([]);
  const [summary, setSummary] = useState<GuestSummary>(emptySummary);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("All");
  const [messageTemplate, setMessageTemplate] = useState<MessageTemplate>("RSVP reminder");
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("closed");
  const [importPreview, setImportPreview] = useState<GuestForm[]>([]);
  const [selectedGuestIds, setSelectedGuestIds] = useState<Set<string>>(new Set());
  const [addForm, setAddForm] = useState<GuestForm>(emptyGuestForm);
  const [editingGuestId, setEditingGuestId] = useState("");
  const [editForm, setEditForm] = useState<GuestForm>(emptyGuestForm);

  const busy = status === "loading";
  const duplicateGuestIds = useMemo(() => {
    const ids = new Set<string>();
    const byEmail = new Map<string, CoupleGuest[]>();
    const byPhone = new Map<string, CoupleGuest[]>();
    const byNameHousehold = new Map<string, CoupleGuest[]>();

    for (const guest of guests) {
      const email = normalizeComparison(guest.email);
      const phone = normalizePhone(guest.phoneNumber);
      const nameHousehold = `${normalizeComparison(guest.fullName)}|${normalizeComparison(getHouseholdName(guest))}`;

      if (email) byEmail.set(email, [...(byEmail.get(email) ?? []), guest]);
      if (phone) byPhone.set(phone, [...(byPhone.get(phone) ?? []), guest]);
      if (nameHousehold.trim() !== "|ungrouped household") {
        byNameHousehold.set(nameHousehold, [...(byNameHousehold.get(nameHousehold) ?? []), guest]);
      }
    }

    for (const group of [...byEmail.values(), ...byPhone.values(), ...byNameHousehold.values()]) {
      if (group.length > 1) group.forEach((guest) => ids.add(guest.id));
    }

    return ids;
  }, [guests]);

  const householdCount = useMemo(() => new Set(guests.map(getHouseholdName)).size, [guests]);
  const attentionCards = useMemo(
    () => [
      { label: "Waiting RSVPs", value: guests.filter((guest) => getGuestStatus(guest) !== "Responded").length, filter: "Waiting" as const },
      { label: "Missing contact info", value: guests.filter(hasMissingContact).length, filter: "Missing contact info" as const },
      { label: "Dietary notes", value: guests.filter((guest) => Boolean(getDietaryNotes(guest))).length, filter: "Dietary" as const },
      {
        label: "Plus-one names needed",
        value: guests.filter((guest) => guest.plusOneAllowed && getPlusOneResponse(guest) === true && !guest.plusOneName).length,
        filter: "Plus ones" as const,
      },
      {
        label: "Missing ceremony/reception",
        value: guests.filter((guest) => getCeremonyResponse(guest) === null || getReceptionResponse(guest) === null).length,
        filter: "Needs follow-up" as const,
      },
      { label: "Potential duplicates", value: duplicateGuestIds.size, filter: "Potential duplicates" as const },
    ],
    [duplicateGuestIds.size, guests],
  );

  const filteredGuests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return guests.filter((guest) => {
      if (quickFilter === "Waiting" && getGuestStatus(guest) === "Responded") return false;
      if (quickFilter === "Responded" && getGuestStatus(guest) !== "Responded") return false;
      if (quickFilter === "Attending" && getCeremonyResponse(guest) !== true && getReceptionResponse(guest) !== true) return false;
      if (quickFilter === "Declined" && (getCeremonyResponse(guest) !== false || getReceptionResponse(guest) !== false)) return false;
      if (quickFilter === "Ceremony" && getCeremonyResponse(guest) !== true) return false;
      if (quickFilter === "Reception" && getReceptionResponse(guest) !== true) return false;
      if (quickFilter === "Plus ones" && !guest.plusOneAllowed && getPlusOneResponse(guest) !== true) return false;
      if (quickFilter === "Dietary" && !getDietaryNotes(guest)) return false;
      if (quickFilter === "Missing contact info" && !hasMissingContact(guest)) return false;
      if (quickFilter === "Bride side" && normalizeComparison(guest.side) !== "bride") return false;
      if (quickFilter === "Groom side" && normalizeComparison(guest.side) !== "groom") return false;
      if (quickFilter === "Needs follow-up" && !needsFollowUp(guest)) return false;
      if (quickFilter === "Potential duplicates" && !duplicateGuestIds.has(guest.id)) return false;

      if (!normalizedQuery) {
        return true;
      }

      return [
        guest.fullName,
        guest.householdName,
        guest.householdAddress,
        guest.phoneNumber,
        guest.email,
        guest.side,
        getGuestStatus(guest),
        getDietaryNotes(guest),
        guest.plusOneName,
        guest.notes,
        guest.householdNotes,
      ].some((value) => value?.toLowerCase().includes(normalizedQuery));
    });
  }, [duplicateGuestIds, guests, query, quickFilter]);

  const selectedGuests = useMemo(
    () => guests.filter((guest) => selectedGuestIds.has(guest.id)),
    [guests, selectedGuestIds],
  );

  const selectedSmsGuests = selectedGuests.filter((guest) => normalizePhone(guest.phoneNumber));
  const allVisibleSelected =
    filteredGuests.length > 0 && filteredGuests.every((guest) => selectedGuestIds.has(guest.id));

  async function loadGuests() {
    setStatus("loading");
    setMessage("");

    const response = await fetch(PRIVATE_PLANNING_GUESTS_ENDPOINT, {
      cache: "no-store",
      credentials: "same-origin",
    });

    let result: GuestListResponse;
    try {
      result = (await response.json()) as GuestListResponse;
    } catch {
      throw new Error("Server error — could not load the guest list. Please try again.");
    }

    if (!response.ok || !result.ok || !result.guests || !result.summary) {
      throw new Error(result.error ?? "Could not load the guest list.");
    }

    setGuests(result.guests);
    setSummary(result.summary);
    setSelectedGuestIds((current) => {
      const availableIds = new Set(result.guests!.map((guest) => guest.id));
      return new Set([...current].filter((id) => availableIds.has(id)));
    });
    setStatus("idle");
  }

  async function requestGuestChange(method: "POST" | "PATCH" | "DELETE", body: object) {
    const response = await fetch(PRIVATE_PLANNING_GUESTS_ENDPOINT, {
      method,
      headers: {
        "Content-Type": "application/json",
        [PRIVATE_PLANNING_CSRF_HEADER]: "1",
      },
      body: JSON.stringify(body),
      cache: "no-store",
      credentials: "same-origin",
    });

    let result: GuestListResponse;
    try {
      result = (await response.json()) as GuestListResponse;
    } catch {
      throw new Error("Server error — could not save the guest list. Please try again.");
    }

    if (!response.ok || !result.ok) {
      throw new Error(result.error ?? "Could not save the guest list.");
    }

    return result;
  }

  function replaceGuest(updatedGuest: CoupleGuest) {
    setGuests((current) => current.map((guest) => (guest.id === updatedGuest.id ? updatedGuest : guest)));
  }

  async function patchGuest(guest: CoupleGuest, body: object, successMessage?: string) {
    try {
      setStatus("loading");
      setMessage("");
      const result = await requestGuestChange("PATCH", { id: guest.id, ...body });

      if (result.guest) {
        replaceGuest(result.guest);
      }

      await loadGuests();
      setStatus("success");
      setMessage(successMessage ?? `${guest.fullName} updated.`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : `Could not update ${guest.fullName}.`);
    }
  }

  async function applyBulkPatch(body: object, label: string) {
    if (selectedGuests.length === 0) {
      return;
    }

    try {
      setStatus("loading");
      setMessage("");
      for (const guest of selectedGuests) {
        await requestGuestChange("PATCH", { id: guest.id, ...body });
      }
      await loadGuests();
      setStatus("success");
      setMessage(`${label} applied to ${selectedGuests.length} selected guest${selectedGuests.length === 1 ? "" : "s"}.`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not apply the bulk update.");
    }
  }

  async function handleRefresh() {
    try {
      await loadGuests();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not refresh the guest list.");
    }
  }

  async function handleAddGuest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setStatus("loading");
      setMessage("");
      await requestGuestChange("POST", formToBody(addForm));
      setAddForm(emptyGuestForm);
      setDrawerMode("closed");
      await loadGuests();
      setStatus("success");
      setMessage("Guest added.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not add guest.");
    }
  }

  async function handleSaveGuest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setStatus("loading");
      setMessage("");
      await requestGuestChange("PATCH", { id: editingGuestId, ...formToBody(editForm) });
      setEditingGuestId("");
      setDrawerMode("closed");
      await loadGuests();
      setStatus("success");
      setMessage("Guest updated.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not update guest.");
    }
  }

  async function handleDeleteGuest(guest: CoupleGuest) {
    if (!window.confirm(`Remove ${guest.fullName} from the guest list?`)) {
      return;
    }

    try {
      setStatus("loading");
      setMessage("");
      await requestGuestChange("DELETE", { id: guest.id });
      setSelectedGuestIds((current) => {
        const next = new Set(current);
        next.delete(guest.id);
        return next;
      });
      await loadGuests();
      setStatus("success");
      setMessage("Guest removed.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not remove guest.");
    }
  }

  function startEdit(guest: CoupleGuest) {
    setEditingGuestId(guest.id);
    setEditForm(formFromGuest(guest));
    setDrawerMode("edit");
    setMessage("");
  }

  function toggleGuestSelection(guestId: string) {
    setSelectedGuestIds((current) => {
      const next = new Set(current);

      if (next.has(guestId)) {
        next.delete(guestId);
      } else {
        next.add(guestId);
      }

      return next;
    });
  }

  function toggleVisibleSelection() {
    setSelectedGuestIds((current) => {
      const next = new Set(current);

      if (allVisibleSelected) {
        filteredGuests.forEach((guest) => next.delete(guest.id));
      } else {
        filteredGuests.forEach((guest) => next.add(guest.id));
      }

      return next;
    });
  }

  function getGuestInviteMessage(guest: CoupleGuest) {
    const currentSiteUrl = typeof window === "undefined" ? "" : window.location.origin;
    return buildInviteMessage(guest.fullName, buildInviteLink(currentSiteUrl, guest.rsvpToken ?? guest.inviteToken), messageTemplate);
  }

  async function markGuestSmsSent(guest: CoupleGuest) {
    await requestGuestChange("PATCH", { id: guest.id, action: "markSmsSent", lastMessageType: messageTemplate });
    await loadGuests();
  }

  async function openGuestSms(guest: CoupleGuest) {
    if (!normalizePhone(guest.phoneNumber)) {
      return;
    }

    try {
      await markGuestSmsSent(guest);
    } catch {
      setStatus("error");
      setMessage("SMS opened, but we could not update the SMS sent marker.");
    }

    window.location.href = buildSmsHref(guest.phoneNumber, getGuestInviteMessage(guest));
  }

  async function copyGuestSmsText(guest: CoupleGuest) {
    try {
      await navigator.clipboard.writeText(getGuestInviteMessage(guest));
      await patchGuest(guest, { action: "markRsvpLinkSent", lastMessageType: messageTemplate }, `Copied SMS text for ${guest.fullName}.`);
      setCopiedGuestId(guest.id);
      window.setTimeout(() => setCopiedGuestId(""), 1800);
    } catch {
      setStatus("error");
      setMessage("Could not copy SMS text. You can still use the SMS button.");
    }
  }

  async function copyGuestRsvpLink(guest: CoupleGuest) {
    try {
      const currentSiteUrl = typeof window === "undefined" ? "" : window.location.origin;
      await navigator.clipboard.writeText(buildInviteLink(currentSiteUrl, guest.rsvpToken ?? guest.inviteToken));
      await patchGuest(guest, { action: "markRsvpLinkSent", lastMessageType: "RSVP link copied" }, `Copied RSVP link for ${guest.fullName}.`);
      setCopiedGuestId(guest.id);
      window.setTimeout(() => setCopiedGuestId(""), 1800);
    } catch {
      setStatus("error");
      setMessage("Could not copy RSVP link.");
    }
  }

  async function copySelectedSmsTexts() {
    try {
      const text = selectedSmsGuests
        .map((guest) => `${guest.fullName} (${guest.phoneNumber ?? "No phone"}):\n${getGuestInviteMessage(guest)}`)
        .join("\n\n");

      await navigator.clipboard.writeText(text);
      await applyBulkPatch({ action: "markRsvpLinkSent", lastMessageType: messageTemplate }, "Message log");
      setStatus("success");
      setMessage(`Copied ${selectedSmsGuests.length} prepared SMS text${selectedSmsGuests.length === 1 ? "" : "s"}.`);
    } catch {
      setStatus("error");
      setMessage("Could not copy selected SMS texts. Try copying one guest at a time.");
    }
  }

  async function regenerateGuestInvite(guest: CoupleGuest) {
    if (!window.confirm(`Regenerate the RSVP link for ${guest.fullName}? The old link will stop working.`)) {
      return;
    }

    await patchGuest(guest, { action: "regenerateInviteToken" }, `Regenerated RSVP link for ${guest.fullName}.`);
  }

  async function deleteSelectedGuests() {
    if (selectedGuests.length === 0) {
      return;
    }

    if (!window.confirm(`Remove ${selectedGuests.length} selected guest${selectedGuests.length === 1 ? "" : "s"}?`)) {
      return;
    }

    try {
      setStatus("loading");
      setMessage("");
      for (const guest of selectedGuests) {
        await requestGuestChange("DELETE", { id: guest.id });
      }
      setSelectedGuestIds(new Set());
      await loadGuests();
      setStatus("success");
      setMessage("Selected guests removed.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not remove selected guests.");
    }
  }

  function exportSelectedGuests() {
    if (selectedGuests.length === 0) {
      return;
    }

    const confirmed = window.confirm("This export contains sensitive selected guest data. Keep it private.");

    if (confirmed) {
      downloadGuestCsv("sumaya-aditya-selected-guests.csv", selectedGuests);
    }
  }

  async function handleImportFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];

    if (!file) {
      return;
    }

    const text = await file.text();
    setImportPreview(mapCsvGuestRows(parseGuestCsv(text)));
    setDrawerMode("import");
    event.currentTarget.value = "";
  }

  async function confirmImportGuests() {
    if (importPreview.length === 0) {
      return;
    }

    try {
      setStatus("loading");
      setMessage("");
      const response = await fetch("/api/private-planning/guests/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [PRIVATE_PLANNING_CSRF_HEADER]: "1",
        },
        body: JSON.stringify({ guests: importPreview.map(formToBody) }),
        cache: "no-store",
        credentials: "same-origin",
      });
      const result = (await response.json()) as GuestListResponse & { importedCount?: number };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Could not import guests.");
      }

      setImportPreview([]);
      setDrawerMode("closed");
      await loadGuests();
      setStatus("success");
      setMessage(`Imported ${result.importedCount ?? importPreview.length} guest${(result.importedCount ?? importPreview.length) === 1 ? "" : "s"}.`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not import guests.");
    }
  }

  async function downloadCsv() {
    const confirmed = window.confirm(
      "Export includes sensitive guest data. Keep this file private and delete it when you no longer need it.",
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch("/api/private-planning/guests/export", {
        cache: "no-store",
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error("Could not export the guest list.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "sumaya-aditya-guest-list.csv";
      link.click();
      URL.revokeObjectURL(url);
      setStatus("success");
      setMessage("Guest list CSV exported. Keep that file private.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not export the guest list.");
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadGuests();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <div className="grid gap-6 text-[#4f4641]">
        <header className="mb-7 flex flex-col gap-5 border-b border-[#eaded6] pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="heading-micro">Sumaya & Aditya</p>
            <h1 className="heading-primary mt-3">Guest List</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6a5d55]">
              Private guest list and SMS composer. Guest-facing RSVP links stay separate and only expose each guest&apos;s own invite.
            </p>
            <p className="mt-2 max-w-2xl text-xs leading-6 text-[#8c7a72]">
              Exports include sensitive guest data. Keep downloaded files private.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setAddForm(emptyGuestForm);
                setDrawerMode("add");
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--color-navy)] px-5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-cta-text)] shadow-[0_12px_30px_rgba(20,26,44,0.2)] transition hover:bg-[var(--color-navy-hover)]"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              Add Guest
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={busy}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#eaded6] bg-[#fffaf7] px-5 text-xs font-semibold uppercase tracking-[0.14em] text-[#3f302b] transition hover:border-[#d8bd96] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw aria-hidden="true" className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-[#eaded6] bg-[#fffaf7] px-5 text-xs font-semibold uppercase tracking-[0.14em] text-[#3f302b] transition hover:border-[#d8bd96]">
              <Upload aria-hidden="true" className="h-4 w-4" />
              Import CSV
              <input type="file" accept=".csv,text/csv" onChange={(event) => void handleImportFile(event)} className="hidden" />
            </label>
            <button
              type="button"
              onClick={downloadCsv}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--color-navy)] px-5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-cta-text)] shadow-[0_12px_30px_rgba(20,26,44,0.2)] transition hover:bg-[var(--color-navy-hover)]"
            >
              <Download aria-hidden="true" className="h-4 w-4" />
              CSV
            </button>
          </div>
        </header>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-9">
          <SummaryTile label="Total" value={summary.total} />
          <SummaryTile label="Households" value={householdCount} />
          <SummaryTile label="Headcount" value={summary.headcount} />
          <SummaryTile label="Responded" value={summary.responded} tone="sage" />
          <SummaryTile label="Waiting" value={summary.notResponded} tone="warm" />
          <SummaryTile label="Ceremony" value={summary.ceremonyYes} />
          <SummaryTile label="Reception" value={summary.receptionYes} />
          <SummaryTile label="Plus ones" value={summary.plusOnes} />
          <SummaryTile label="Dietary" value={summary.dietaryNotes} tone="warm" />
        </div>

        <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {attentionCards.map((card) => (
            <button
              key={card.label}
              type="button"
              onClick={() => setQuickFilter(card.filter)}
              className={`rounded-2xl border px-5 py-4 text-left transition hover:-translate-y-[1px] ${
                quickFilter === card.filter
                  ? "border-[#b98278] bg-[#fff5f2] shadow-[0_12px_28px_rgba(90,65,50,0.08)]"
                  : "border-[#eaded6] bg-[#fffaf7]/82 hover:border-[#d8bd96]"
              }`}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8c7a72]">Needs Attention</p>
              <div className="mt-3 flex items-end justify-between gap-4">
                <p className="font-serif text-2xl leading-tight text-[#8f6a63]">{card.label}</p>
                <span className="font-serif text-4xl leading-none text-[#3f302b]">{card.value}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="mb-6 grid gap-3 rounded-2xl border border-[#eaded6] bg-[#fffaf7]/82 p-4">
          <label className="relative block">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8c7a72]"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-h-11 w-full rounded-full border border-[#eaded6] bg-white/82 pl-11 pr-4 text-sm outline-none transition focus:border-[#b98278]"
              placeholder="Search guests, phones, sides, dietary notes..."
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {quickFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setQuickFilter(filter)}
                className={`min-h-9 rounded-full px-4 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                  quickFilter === filter ? "bg-[var(--color-navy)] text-[var(--color-cta-text)]" : "border border-[#eaded6] bg-white/75 text-[#5f524b] hover:bg-[#fbf7f2]"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-[#eaded6] pt-4">
            <SelectField label="SMS template" value={messageTemplate} options={messageTemplates} onChange={setMessageTemplate} />
            <button
              type="button"
              onClick={toggleVisibleSelection}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#eaded6] bg-white/75 px-5 text-xs font-semibold uppercase tracking-[0.12em] text-[#3f302b] transition hover:border-[#d8bd96]"
            >
              <CheckSquare aria-hidden="true" className="h-4 w-4" />
              {allVisibleSelected ? "Clear visible" : "Select visible"}
            </button>
            <button
              type="button"
              onClick={() => void applyBulkPatch({ rsvpStatus: "Responded" }, "RSVP responded")}
              disabled={busy || selectedGuests.length === 0}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#eaded6] bg-white/75 px-5 text-xs font-semibold uppercase tracking-[0.12em] text-[#3f302b] transition hover:border-[#d8bd96] disabled:cursor-not-allowed disabled:opacity-45"
            >
              Mark responded
            </button>
            <button
              type="button"
              onClick={() => void applyBulkPatch({ rsvpStatus: "Not responded" }, "RSVP waiting")}
              disabled={busy || selectedGuests.length === 0}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#eaded6] bg-white/75 px-5 text-xs font-semibold uppercase tracking-[0.12em] text-[#3f302b] transition hover:border-[#d8bd96] disabled:cursor-not-allowed disabled:opacity-45"
            >
              Mark waiting
            </button>
            <button
              type="button"
              onClick={() => void applyBulkPatch({ attendingCeremony: "Yes" }, "Ceremony yes")}
              disabled={busy || selectedGuests.length === 0}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#eaded6] bg-white/75 px-5 text-xs font-semibold uppercase tracking-[0.12em] text-[#3f302b] transition hover:border-[#d8bd96] disabled:cursor-not-allowed disabled:opacity-45"
            >
              Ceremony yes
            </button>
            <button
              type="button"
              onClick={() => void applyBulkPatch({ attendingReception: "Yes" }, "Reception yes")}
              disabled={busy || selectedGuests.length === 0}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#eaded6] bg-white/75 px-5 text-xs font-semibold uppercase tracking-[0.12em] text-[#3f302b] transition hover:border-[#d8bd96] disabled:cursor-not-allowed disabled:opacity-45"
            >
              Reception yes
            </button>
            <button
              type="button"
              onClick={exportSelectedGuests}
              disabled={busy || selectedGuests.length === 0}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#eaded6] bg-white/75 px-5 text-xs font-semibold uppercase tracking-[0.12em] text-[#3f302b] transition hover:border-[#d8bd96] disabled:cursor-not-allowed disabled:opacity-45"
            >
              Export selected
            </button>
            <button
              type="button"
              onClick={() => void copySelectedSmsTexts()}
              disabled={busy || selectedSmsGuests.length === 0}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#6f7d5b] px-5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#5d6c4c] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <MessageCircle aria-hidden="true" className="h-4 w-4" />
              Copy SMS text ({selectedSmsGuests.length})
            </button>
            <button
              type="button"
              onClick={() => void deleteSelectedGuests()}
              disabled={busy || selectedGuests.length === 0}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#e6c8c2] bg-[#fff4f2] px-5 text-xs font-semibold uppercase tracking-[0.12em] text-[#7f554f] transition hover:border-[#d8a79e] disabled:cursor-not-allowed disabled:opacity-45"
            >
              Delete selected
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`mb-6 rounded-2xl border px-5 py-4 text-sm leading-6 ${
              status === "error"
                ? "border-[#e6c8c2] bg-[#fff4f2] text-[#8b5f58]"
                : "border-[#d7ded0] bg-[#f5f8f0] text-[#52634a]"
            }`}
          >
            {message}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-[#eaded6] bg-[#fffaf7]/82 shadow-[0_14px_34px_rgba(90,65,50,0.055)]">
          <div className="overflow-x-auto">
            <table className="min-w-[1500px] w-full border-collapse text-left">
              <thead className="bg-[#f8eee9]/80 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#75675f]">
                <tr>
                  <th className="w-12 px-4 py-4">
                    <input type="checkbox" checked={allVisibleSelected} onChange={toggleVisibleSelection} className="h-4 w-4 accent-[#6f7d5b]" aria-label="Select visible guests" />
                  </th>
                  <th className="px-4 py-4">Guest</th>
                  <th className="px-4 py-4">Household</th>
                  <th className="px-4 py-4">Side</th>
                  <th className="px-4 py-4">Phone</th>
                  <th className="px-4 py-4">Email</th>
                  <th className="px-4 py-4">RSVP</th>
                  <th className="px-4 py-4">Ceremony</th>
                  <th className="px-4 py-4">Reception</th>
                  <th className="px-4 py-4">Plus one</th>
                  <th className="px-4 py-4">Dietary</th>
                  <th className="px-4 py-4">Last contacted</th>
                  <th className="px-4 py-4">Notes</th>
                  <th className="px-4 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaded6]">
                {filteredGuests.map((guest) => {
                  const selected = selectedGuestIds.has(guest.id);
                  const phone = normalizePhone(guest.phoneNumber);
                  const inviteLink = buildInviteLink("", guest.rsvpToken ?? guest.inviteToken);

                  return (
                    <tr key={guest.id} className={`${selected ? "bg-[#fff5f2]" : "bg-white/36"} align-top transition hover:bg-white/58`}>
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleGuestSelection(guest.id)}
                          className="h-4 w-4 accent-[#6f7d5b]"
                          aria-label={`Select ${guest.fullName}`}
                        />
                      </td>
                      <td className="min-w-56 px-4 py-4">
                        <InlineTextControl value={guest.fullName} label={`${guest.fullName} full name`} onSave={(value) => void patchGuest(guest, { fullName: value })} />
                        <div className="mt-2 flex flex-wrap gap-2">
                          <StatusBadge tone={getGuestStatus(guest) === "Responded" ? "good" : "warn"}>{getGuestStatus(guest)}</StatusBadge>
                          {duplicateGuestIds.has(guest.id) && <StatusBadge tone="rose">Possible duplicate</StatusBadge>}
                        </div>
                      </td>
                      <td className="min-w-52 px-4 py-4">
                        <InlineTextControl value={guest.householdName} label={`${guest.fullName} household`} placeholder="Household" onSave={(value) => void patchGuest(guest, { householdName: value })} />
                      </td>
                      <td className="min-w-36 px-4 py-4">
                        <InlineTextControl value={guest.side} label={`${guest.fullName} side`} placeholder="Bride/Groom" onSave={(value) => void patchGuest(guest, { side: value })} />
                      </td>
                      <td className="min-w-40 px-4 py-4">
                        <InlineTextControl value={guest.phoneNumber} label={`${guest.fullName} phone`} onSave={(value) => void patchGuest(guest, { phoneNumber: value })} />
                      </td>
                      <td className="min-w-52 px-4 py-4">
                        <InlineTextControl value={guest.email} label={`${guest.fullName} email`} onSave={(value) => void patchGuest(guest, { email: value })} />
                      </td>
                      <td className="min-w-40 px-4 py-4">
                        <InlineSelectControl value={getGuestStatus(guest)} label={`${guest.fullName} RSVP`} options={["Not responded", "Responded"] as const} onSave={(value) => void patchGuest(guest, { rsvpStatus: value })} />
                      </td>
                      <td className="min-w-36 px-4 py-4">
                        <InlineSelectControl value={booleanToAttendance(getCeremonyResponse(guest))} label={`${guest.fullName} ceremony`} options={attendanceOptions} onSave={(value) => void patchGuest(guest, { attendingCeremony: value })} />
                      </td>
                      <td className="min-w-36 px-4 py-4">
                        <InlineSelectControl value={booleanToAttendance(getReceptionResponse(guest))} label={`${guest.fullName} reception`} options={attendanceOptions} onSave={(value) => void patchGuest(guest, { attendingReception: value })} />
                      </td>
                      <td className="min-w-44 px-4 py-4">
                        <InlineSelectControl value={getPlusOneResponse(guest) ? "Yes" : "No"} label={`${guest.fullName} plus one`} options={["No", "Yes"] as const} onSave={(value) => void patchGuest(guest, { bringingPlusOne: value })} />
                        {getPlusOneResponse(guest) && (
                          <div className="mt-2">
                            <InlineTextControl value={guest.plusOneName} label={`${guest.fullName} plus one name`} placeholder="Plus-one name" onSave={(value) => void patchGuest(guest, { plusOneName: value })} />
                          </div>
                        )}
                      </td>
                      <td className="min-w-52 px-4 py-4">
                        <InlineTextControl value={getDietaryNotes(guest)} label={`${guest.fullName} dietary notes`} placeholder="Dietary notes" onSave={(value) => void patchGuest(guest, { dietaryRequirements: value })} />
                      </td>
                      <td className="min-w-44 px-4 py-4 text-sm leading-6 text-[#6a5d55]">
                        <p>{formatDate(guest.lastContactedAt ?? guest.smsSentAt ?? guest.rsvpLinkSentAt)}</p>
                        {guest.lastMessageType && <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8c7a72]">{guest.lastMessageType}</p>}
                      </td>
                      <td className="min-w-56 px-4 py-4">
                        <InlineTextControl value={guest.notes} label={`${guest.fullName} notes`} placeholder="Private notes" onSave={(value) => void patchGuest(guest, { notes: value })} />
                      </td>
                      <td className="min-w-72 px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <a
                            href={inviteLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#eaded6] bg-white/75 px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#3f302b] transition hover:border-[#d8bd96]"
                          >
                            <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                            Open
                          </a>
                          <button
                            type="button"
                            onClick={() => void copyGuestRsvpLink(guest)}
                            className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#eaded6] bg-white/75 px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#3f302b] transition hover:border-[#d8bd96]"
                          >
                            <Copy aria-hidden="true" className="h-3.5 w-3.5" />
                            {copiedGuestId === guest.id ? "Copied" : "Link"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void regenerateGuestInvite(guest)}
                            className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#eaded6] bg-white/75 px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#3f302b] transition hover:border-[#d8bd96]"
                          >
                            <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
                            Regen
                          </button>
                          {phone ? (
                            <button
                              type="button"
                              onClick={() => void openGuestSms(guest)}
                              className="inline-flex min-h-9 items-center gap-2 rounded-full bg-[#6f7d5b] px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-white transition hover:bg-[#5d6c4c]"
                            >
                              <MessageCircle aria-hidden="true" className="h-3.5 w-3.5" />
                              SMS
                            </button>
                          ) : (
                            <span className="inline-flex min-h-9 items-center gap-2 rounded-full bg-[#e9ddd6] px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8c7a72]">
                              <MessageCircle aria-hidden="true" className="h-3.5 w-3.5" />
                              No phone
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => void copyGuestSmsText(guest)}
                            className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#eaded6] bg-white/75 px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#3f302b] transition hover:border-[#d8bd96]"
                          >
                            <MessageCircle aria-hidden="true" className="h-3.5 w-3.5" />
                            {copiedGuestId === guest.id ? "Copied" : "Text"}
                          </button>
                          {guest.phoneNumber && (
                            <a
                              href={`tel:${phone}`}
                              className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#eaded6] bg-white/75 px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#3f302b] transition hover:border-[#d8bd96]"
                            >
                              <Phone aria-hidden="true" className="h-3.5 w-3.5" />
                              Call
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => startEdit(guest)}
                            className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#eaded6] bg-white/75 px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#3f302b] transition hover:border-[#d8bd96]"
                          >
                            <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDeleteGuest(guest)}
                            className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#e6c8c2] bg-[#fff4f2] px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#7f554f] transition hover:border-[#d8a79e]"
                          >
                            <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {filteredGuests.length === 0 && (
          <div className="rounded-2xl border border-[#eaded6] bg-[#fffaf7]/82 px-5 py-12 text-center">
            <UsersRound aria-hidden="true" className="mx-auto h-8 w-8 text-[#9b6f68]" />
            <p className="mt-4 font-serif text-2xl text-[#3f302b]">No guests found</p>
          </div>
        )}

        {drawerMode !== "closed" && (
          <div className="fixed inset-0 z-50 flex justify-end bg-[#3f302b]/22 backdrop-blur-[3px]">
            <button
              type="button"
              aria-label="Close guest drawer"
              className="absolute inset-0 cursor-default"
              onClick={() => {
                setDrawerMode("closed");
                setEditingGuestId("");
              }}
            />
            <aside className="relative h-full w-full max-w-[44rem] overflow-y-auto border-l border-[#eaded6]/70 bg-[#fbf7f2] shadow-[-22px_0_54px_rgba(80,60,55,0.14)] motion-safe:animate-[guest-drawer-enter_420ms_cubic-bezier(0.22,1,0.36,1)_both]">
              {drawerMode === "add" && (
                <GuestEditor
                  title="Add Guest"
                  submitLabel="Add guest"
                  form={addForm}
                  busy={busy}
                  onChange={(key, value) => setAddForm((current) => ({ ...current, [key]: value }))}
                  onSubmit={handleAddGuest}
                  onCancel={() => setDrawerMode("closed")}
                />
              )}

              {drawerMode === "edit" && (
                <GuestEditor
                  title={`Edit ${editForm.fullName || "Guest"}`}
                  submitLabel="Save"
                  form={editForm}
                  busy={busy}
                  onChange={(key, value) => setEditForm((current) => ({ ...current, [key]: value }))}
                  onSubmit={handleSaveGuest}
                  onCancel={() => {
                    setDrawerMode("closed");
                    setEditingGuestId("");
                  }}
                />
              )}

              {drawerMode === "import" && (
                <div className="rounded-2xl border border-[#eaded6] bg-[#fffaf7]/82 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="heading-micro">CSV Import</p>
                      <h2 className="heading-secondary heading-secondary-compact mt-2">Preview Guests</h2>
                      <p className="mt-2 text-sm leading-6 text-[#6a5d55]">Review the detected rows before saving them to the private guest list.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDrawerMode("closed");
                        setImportPreview([]);
                      }}
                      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#eaded6] bg-white/75 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#3f302b] transition hover:border-[#d8bd96]"
                    >
                      <X aria-hidden="true" className="h-4 w-4" />
                      Cancel
                    </button>
                  </div>

                  <div className="mt-5 max-h-[55vh] overflow-y-auto rounded-2xl border border-[#eaded6] bg-white/55">
                    {importPreview.map((guest, index) => (
                      <div key={`${guest.fullName}-${index}`} className="border-b border-[#eaded6] px-4 py-3 last:border-b-0">
                        <p className="font-serif text-xl text-[#3f302b]">{guest.fullName}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#8c7a72]">
                          {guest.householdName || "No household"} · {guest.phoneNumber || "No phone"} · {guest.email || "No email"}
                        </p>
                      </div>
                    ))}
                    {importPreview.length === 0 && <p className="px-4 py-8 text-center text-sm text-[#6a5d55]">No valid rows detected.</p>}
                  </div>

                  <button
                    type="button"
                    onClick={() => void confirmImportGuests()}
                    disabled={busy || importPreview.length === 0}
                    className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[var(--color-navy)] px-5 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-cta-text)] shadow-[0_12px_30px_rgba(20,26,44,0.2)] transition hover:bg-[var(--color-navy-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Upload aria-hidden="true" className="h-4 w-4" />
                    Import {importPreview.length} guest{importPreview.length === 1 ? "" : "s"}
                  </button>
                </div>
              )}
            </aside>
          </div>
        )}

        <footer className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs leading-6 text-[#75675f]">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-[#6f7d5b]" />
            Showing {filteredGuests.length} of {guests.length} guests.
          </span>
          <span>
            Selected {selectedGuests.length}; SMS-ready {selectedSmsGuests.length}.
          </span>
        </footer>
    </div>
  );
}
