"use client";

import { type FormEvent, useMemo, useState } from "react";
import {
  CheckCircle2,
  CheckSquare,
  Download,
  LockKeyhole,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";

type CoupleGuest = {
  id: string;
  fullName: string;
  phoneNumber: string | null;
  email: string | null;
  side: string | null;
  notes: string | null;
  inviteToken: string;
  rsvpResponse: RsvpStatus;
  attendingCeremony: boolean | null;
  attendingReception: boolean | null;
  bringingPlusOne: boolean;
  plusOneName: string | null;
  dietaryRequirements: string | null;
  songRequest: string | null;
  message: string | null;
  respondedAt: string | null;
  updatedAt: string;
};

type GuestSummary = {
  total: number;
  responded: number;
  notResponded: number;
  ceremonyYes: number;
  receptionYes: number;
  plusOnes: number;
  dietaryNotes: number;
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
  responded: 0,
  notResponded: 0,
  ceremonyYes: 0,
  receptionYes: 0,
  plusOnes: 0,
  dietaryNotes: 0,
};

const emptyGuestForm: GuestForm = {
  fullName: "",
  phoneNumber: "",
  email: "",
  side: "",
  notes: "",
  rsvpResponse: "Not responded",
  attendingCeremony: "Not answered",
  attendingReception: "Not answered",
  bringingPlusOne: "No",
  plusOneName: "",
  dietaryRequirements: "",
  songRequest: "",
  message: "",
};

const statusFilters = ["All", "Responded", "Not responded"] as const;
const attendanceOptions: AttendanceValue[] = ["Not answered", "Yes", "No"];

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

function formatValue(value: string | null) {
  return value && value.trim().length > 0 ? value : "Not provided";
}

function normalizePhone(value: string | null) {
  return value?.replace(/[^\d+]/g, "") ?? "";
}

function buildInviteLink(siteUrl: string, inviteToken: string) {
  const baseUrl = siteUrl || "";
  return `${baseUrl}/?guest=${encodeURIComponent(inviteToken)}#rsvp`;
}

function buildInviteMessage(fullName: string, inviteLink: string) {
  return `Hi ${fullName}, please RSVP for Sumaya and Aditya's wedding here: ${inviteLink}`;
}

function buildSmsHref(phoneNumber: string | null, message: string) {
  const phone = normalizePhone(phoneNumber);
  return `sms:${phone}?&body=${encodeURIComponent(message)}`;
}

function csvCell(value: string | number | boolean | null) {
  const text = value === null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function buildCsv(guests: CoupleGuest[]) {
  const headers = [
    "Name",
    "Phone",
    "Email",
    "Side",
    "RSVP",
    "Ceremony",
    "Reception",
    "Plus one",
    "Plus one name",
    "Dietary requirements",
    "Song request",
    "Message",
    "Notes",
    "Responded at",
  ];

  const rows = guests.map((guest) => [
    guest.fullName,
    guest.phoneNumber,
    guest.email,
    guest.side,
    guest.rsvpResponse,
    formatAnswer(guest.attendingCeremony),
    formatAnswer(guest.attendingReception),
    guest.bringingPlusOne ? "Yes" : "No",
    guest.plusOneName,
    guest.dietaryRequirements,
    guest.songRequest,
    guest.message,
    guest.notes,
    guest.respondedAt,
  ]);

  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

function formFromGuest(guest: CoupleGuest): GuestForm {
  return {
    fullName: guest.fullName,
    phoneNumber: guest.phoneNumber ?? "",
    email: guest.email ?? "",
    side: guest.side ?? "",
    notes: guest.notes ?? "",
    rsvpResponse: guest.rsvpResponse,
    attendingCeremony: booleanToAttendance(guest.attendingCeremony),
    attendingReception: booleanToAttendance(guest.attendingReception),
    bringingPlusOne: guest.bringingPlusOne ? "Yes" : "No",
    plusOneName: guest.plusOneName ?? "",
    dietaryRequirements: guest.dietaryRequirements ?? "",
    songRequest: guest.songRequest ?? "",
    message: guest.message ?? "",
  };
}

function formToBody(form: GuestForm) {
  return {
    ...form,
    attendingCeremony: attendanceToBody(form.attendingCeremony),
    attendingReception: attendanceToBody(form.attendingReception),
    bringingPlusOne: form.bringingPlusOne === "Yes",
    plusOneName: form.bringingPlusOne === "Yes" ? form.plusOneName : "",
  };
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

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#8c7a72]">{label}</p>
      <p className="mt-1 text-sm leading-6 text-[#4f4641]">{value}</p>
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
    <label className="grid gap-2">
      <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#8c7a72]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-xl border border-[#eaded6] bg-white/85 px-4 text-sm text-[#3f302b] outline-none transition focus:border-[#b98278]"
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
    <label className="grid gap-2">
      <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#8c7a72]">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className="rounded-xl border border-[#eaded6] bg-white/85 px-4 py-3 text-sm text-[#3f302b] outline-none transition focus:border-[#b98278]"
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
    <label className="grid gap-2">
      <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#8c7a72]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="min-h-11 rounded-xl border border-[#eaded6] bg-white/85 px-4 text-sm text-[#3f302b] outline-none transition focus:border-[#b98278]"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
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
  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-[#eaded6] bg-[#fffaf7]/82 p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-serif text-2xl leading-tight text-[#3f302b]">{title}</h2>
        <div className="flex flex-wrap gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#eaded6] bg-white/75 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#3f302b] transition hover:border-[#d8bd96]"
            >
              <X aria-hidden="true" className="h-4 w-4" />
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={busy}
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#241815] px-4 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#382722] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitLabel === "Save" ? <Save aria-hidden="true" className="h-4 w-4" /> : <Plus aria-hidden="true" className="h-4 w-4" />}
            {busy ? "Saving..." : submitLabel}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <TextField label="Full name" value={form.fullName} onChange={(value) => onChange("fullName", value)} />
        <TextField label="Phone" value={form.phoneNumber} onChange={(value) => onChange("phoneNumber", value)} />
        <TextField label="Email" type="email" value={form.email} onChange={(value) => onChange("email", value)} />
        <TextField label="Side" value={form.side} onChange={(value) => onChange("side", value)} placeholder="Bride, groom, family..." />
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
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <TextAreaField label="Guest message" value={form.message} onChange={(value) => onChange("message", value)} />
        <TextAreaField label="Private notes" value={form.notes} onChange={(value) => onChange("notes", value)} />
      </div>
    </form>
  );
}

export default function GuestListDashboard() {
  const [passcode, setPasscode] = useState("");
  const [activePasscode, setActivePasscode] = useState("");
  const [copiedGuestId, setCopiedGuestId] = useState("");
  const [guests, setGuests] = useState<CoupleGuest[]>([]);
  const [summary, setSummary] = useState<GuestSummary>(emptySummary);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]>("All");
  const [selectedGuestIds, setSelectedGuestIds] = useState<Set<string>>(new Set());
  const [addForm, setAddForm] = useState<GuestForm>(emptyGuestForm);
  const [editingGuestId, setEditingGuestId] = useState("");
  const [editForm, setEditForm] = useState<GuestForm>(emptyGuestForm);

  const unlocked = Boolean(activePasscode);
  const busy = status === "loading";

  const filteredGuests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return guests.filter((guest) => {
      const matchesStatus = statusFilter === "All" || guest.rsvpResponse === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [
        guest.fullName,
        guest.phoneNumber,
        guest.email,
        guest.side,
        guest.rsvpResponse,
        guest.dietaryRequirements,
        guest.plusOneName,
      ].some((value) => value?.toLowerCase().includes(normalizedQuery));
    });
  }, [guests, query, statusFilter]);

  const selectedGuests = useMemo(
    () => guests.filter((guest) => selectedGuestIds.has(guest.id)),
    [guests, selectedGuestIds],
  );

  const selectedSmsGuests = selectedGuests.filter((guest) => normalizePhone(guest.phoneNumber));
  const allVisibleSelected =
    filteredGuests.length > 0 && filteredGuests.every((guest) => selectedGuestIds.has(guest.id));

  async function loadGuests(passcodeToUse = activePasscode) {
    setStatus("loading");
    setMessage("");

    const response = await fetch("/api/guest-list", {
      headers: {
        "x-guest-list-passcode": passcodeToUse,
      },
    });
    const result = (await response.json()) as GuestListResponse;

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
    const response = await fetch("/api/guest-list", {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-guest-list-passcode": activePasscode,
      },
      body: JSON.stringify(body),
    });
    const result = (await response.json()) as GuestListResponse;

    if (!response.ok || !result.ok) {
      throw new Error(result.error ?? "Could not save the guest list.");
    }

    return result;
  }

  async function handleUnlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      if (!passcode.trim()) {
        throw new Error("Enter the couple passcode to open the guest list.");
      }

      await loadGuests(passcode);
      setActivePasscode(passcode);
      setPasscode("");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not open the guest list.");
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
    return buildInviteMessage(guest.fullName, buildInviteLink(currentSiteUrl, guest.inviteToken));
  }

  function openGuestSms(guest: CoupleGuest) {
    if (!normalizePhone(guest.phoneNumber)) {
      return;
    }

    window.location.href = buildSmsHref(guest.phoneNumber, getGuestInviteMessage(guest));
  }

  async function copyGuestSmsText(guest: CoupleGuest) {
    try {
      await navigator.clipboard.writeText(getGuestInviteMessage(guest));
      setCopiedGuestId(guest.id);
      setStatus("success");
      setMessage(`Copied SMS text for ${guest.fullName}.`);
      window.setTimeout(() => setCopiedGuestId(""), 1800);
    } catch {
      setStatus("error");
      setMessage("Could not copy SMS text. You can still use the SMS button.");
    }
  }

  async function copySelectedSmsTexts() {
    try {
      const text = selectedSmsGuests
        .map((guest) => `${guest.fullName} (${guest.phoneNumber ?? "No phone"}):\n${getGuestInviteMessage(guest)}`)
        .join("\n\n");

      await navigator.clipboard.writeText(text);
      setStatus("success");
      setMessage(`Copied ${selectedSmsGuests.length} prepared SMS text${selectedSmsGuests.length === 1 ? "" : "s"}.`);
    } catch {
      setStatus("error");
      setMessage("Could not copy selected SMS texts. Try copying one guest at a time.");
    }
  }

  function downloadCsv() {
    const csv = buildCsv(filteredGuests);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sumaya-aditya-guest-list.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!unlocked) {
    return (
      <main className="min-h-screen bg-[#fbf7f2] px-6 py-16 text-[#4f4641]">
        <section className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-xl flex-col items-center justify-center text-center">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-[#eaded6] bg-[#fffaf7] text-[#9b6f68]">
            <LockKeyhole aria-hidden="true" className="h-6 w-6" />
          </div>
          <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.42em] text-[#6e5b54]">
            Sumaya & Aditya
          </p>
          <h1 className="rose-gold-foil font-serif text-5xl leading-tight md:text-6xl">Guest List</h1>
          <p className="mt-6 text-base leading-8 text-[#6a5d55]">
            Private guest list and SMS composer for sending RSVP links from your phone.
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
              disabled={busy}
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#241815] px-7 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white shadow-[0_12px_30px_rgba(36,24,21,0.18)] transition duration-300 ease-out hover:-translate-y-[1px] hover:bg-[#382722] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LockKeyhole aria-hidden="true" className="h-4 w-4" />
              {busy ? "Opening..." : "Enter guest list"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fbf7f2] px-5 py-8 text-[#4f4641] md:px-8 md:py-10">
      <section className="mx-auto max-w-7xl">
        <header className="mb-7 flex flex-col gap-5 border-b border-[#eaded6] pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.36em] text-[#6e5b54]">Sumaya & Aditya</p>
            <h1 className="mt-3 font-serif text-4xl leading-tight text-[#3f302b] md:text-5xl">Guest List</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6a5d55]">
              Open each SMS from your phone to send the prepared RSVP message using your normal mobile plan.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={busy}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#eaded6] bg-[#fffaf7] px-5 text-xs font-semibold uppercase tracking-[0.14em] text-[#3f302b] transition hover:border-[#d8bd96] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw aria-hidden="true" className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={downloadCsv}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#241815] px-5 text-xs font-semibold uppercase tracking-[0.14em] text-white shadow-[0_12px_30px_rgba(36,24,21,0.14)] transition hover:bg-[#382722]"
            >
              <Download aria-hidden="true" className="h-4 w-4" />
              CSV
            </button>
          </div>
        </header>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          <SummaryTile label="Total" value={summary.total} />
          <SummaryTile label="Responded" value={summary.responded} tone="sage" />
          <SummaryTile label="Waiting" value={summary.notResponded} tone="warm" />
          <SummaryTile label="Ceremony" value={summary.ceremonyYes} />
          <SummaryTile label="Reception" value={summary.receptionYes} />
          <SummaryTile label="Plus ones" value={summary.plusOnes} />
          <SummaryTile label="Dietary" value={summary.dietaryNotes} tone="warm" />
        </div>

        <div className="mb-6">
          <GuestEditor
            title="Add Guest"
            submitLabel="Add guest"
            form={addForm}
            busy={busy}
            onChange={(key, value) => setAddForm((current) => ({ ...current, [key]: value }))}
            onSubmit={handleAddGuest}
          />
        </div>

        <div className="mb-6 grid gap-3 rounded-2xl border border-[#eaded6] bg-[#fffaf7]/82 p-4 lg:grid-cols-[1fr_auto]">
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
            <div className="grid grid-cols-3 gap-2 rounded-full border border-[#eaded6] bg-white/70 p-1">
              {statusFilters.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setStatusFilter(filter)}
                  className={`min-h-9 rounded-full px-4 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                    statusFilter === filter ? "bg-[#241815] text-white" : "text-[#5f524b] hover:bg-[#fbf7f2]"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
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
              onClick={() => void copySelectedSmsTexts()}
              disabled={busy || selectedSmsGuests.length === 0}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#6f7d5b] px-5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#5d6c4c] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <MessageCircle aria-hidden="true" className="h-4 w-4" />
              Copy SMS text ({selectedSmsGuests.length})
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

        <div className="grid gap-4">
          {filteredGuests.map((guest) => {
            const selected = selectedGuestIds.has(guest.id);
            const phone = normalizePhone(guest.phoneNumber);

            return (
              <article key={guest.id} className="rounded-2xl border border-[#eaded6] bg-[#fffaf7]/82 p-5">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <label className="mt-1 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#eaded6] bg-white/85">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleGuestSelection(guest.id)}
                        className="h-4 w-4 accent-[#6f7d5b]"
                        aria-label={`Select ${guest.fullName}`}
                      />
                    </label>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-serif text-2xl leading-tight text-[#3f302b]">{guest.fullName}</p>
                        <span
                          className={`rounded-full px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                            guest.rsvpResponse === "Responded"
                              ? "bg-[#eef5e9] text-[#52634a]"
                              : "bg-[#fff2e8] text-[#8a6758]"
                          }`}
                        >
                          {guest.rsvpResponse}
                        </span>
                      </div>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <DetailLine label="Phone" value={formatValue(guest.phoneNumber)} />
                        <DetailLine label="Email" value={formatValue(guest.email)} />
                        <DetailLine label="Side" value={formatValue(guest.side)} />
                        <DetailLine label="Responded" value={formatDate(guest.respondedAt)} />
                        <DetailLine label="Ceremony" value={formatAnswer(guest.attendingCeremony)} />
                        <DetailLine label="Reception" value={formatAnswer(guest.attendingReception)} />
                        <DetailLine label="Plus one" value={guest.bringingPlusOne ? guest.plusOneName ?? "Yes" : "No"} />
                        <DetailLine label="Dietary" value={formatValue(guest.dietaryRequirements)} />
                        <DetailLine label="Song" value={formatValue(guest.songRequest)} />
                        <DetailLine label="Message" value={formatValue(guest.message)} />
                        <DetailLine label="Notes" value={formatValue(guest.notes)} />
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {phone ? (
                      <button
                        type="button"
                        onClick={() => openGuestSms(guest)}
                        className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#6f7d5b] px-4 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-[#5d6c4c]"
                      >
                        <MessageCircle aria-hidden="true" className="h-4 w-4" />
                        SMS
                      </button>
                    ) : (
                      <span className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#e9ddd6] px-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#8c7a72]">
                        <MessageCircle aria-hidden="true" className="h-4 w-4" />
                        No phone
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => void copyGuestSmsText(guest)}
                      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#eaded6] bg-white/75 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#3f302b] transition hover:border-[#d8bd96]"
                    >
                      <MessageCircle aria-hidden="true" className="h-4 w-4" />
                      {copiedGuestId === guest.id ? "Copied" : "Copy text"}
                    </button>
                    {guest.phoneNumber && (
                      <a
                        href={`tel:${phone}`}
                        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#eaded6] bg-white/75 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#3f302b] transition hover:border-[#d8bd96]"
                      >
                        <Phone aria-hidden="true" className="h-4 w-4" />
                        Call
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => startEdit(guest)}
                      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#eaded6] bg-white/75 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#3f302b] transition hover:border-[#d8bd96]"
                    >
                      <Pencil aria-hidden="true" className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteGuest(guest)}
                      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#e6c8c2] bg-[#fff4f2] px-4 text-xs font-semibold uppercase tracking-[0.12em] text-[#7f554f] transition hover:border-[#d8a79e]"
                    >
                      <Trash2 aria-hidden="true" className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                </div>

                {editingGuestId === guest.id && (
                  <div className="mt-5 border-t border-[#eaded6] pt-5">
                    <GuestEditor
                      title={`Edit ${guest.fullName}`}
                      submitLabel="Save"
                      form={editForm}
                      busy={busy}
                      onChange={(key, value) => setEditForm((current) => ({ ...current, [key]: value }))}
                      onSubmit={handleSaveGuest}
                      onCancel={() => setEditingGuestId("")}
                    />
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {filteredGuests.length === 0 && (
          <div className="rounded-2xl border border-[#eaded6] bg-[#fffaf7]/82 px-5 py-12 text-center">
            <UsersRound aria-hidden="true" className="mx-auto h-8 w-8 text-[#9b6f68]" />
            <p className="mt-4 font-serif text-2xl text-[#3f302b]">No guests found</p>
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
      </section>
    </main>
  );
}
