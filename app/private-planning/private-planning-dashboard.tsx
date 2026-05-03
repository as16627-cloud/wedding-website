"use client";

import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  LockKeyhole,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

const PLANNING_PASSCODE = "caversham2026";
const PLANNING_ACCESS_KEY = "private-planning-access";
const PLANNING_ACCESS_EVENT = "private-planning-access-change";
const LOCAL_STORAGE_CHANGE_EVENT = "private-planning-local-storage-change";
const VENDORS_KEY = "private-planning-vendors";
const EVENTS_KEY = "private-planning-calendar-events";
const TIMELINE_KEY = "private-planning-timeline";
const QUICK_NOTES_KEY = "private-planning-quick-notes";
const DECISION_NOTES_KEY = "private-planning-decision-notes";
const revealEase = [0.22, 1, 0.36, 1] as const;

const tabs = ["Overview", "Vendors", "Calendar", "Timeline", "Notes"] as const;
const vendorCategories = [
  "Venue",
  "Celebrant",
  "Photography",
  "Videography",
  "Florist",
  "DJ / Entertainment",
  "Cake",
  "Hair & Makeup",
  "Stationery",
  "Decor / Hire",
  "Transport",
  "Accommodation",
  "Audio Guestbook",
] as const;
const vendorStatuses = [
  "Researching",
  "Contacted",
  "Quote received",
  "Shortlisted",
  "Confirmed",
  "Deposit paid",
  "Fully paid",
  "Not proceeding",
] as const;
const eventTypes = ["Vendor meeting", "Payment due", "RSVP deadline", "Fitting / trial", "Rehearsal", "Deadline"] as const;

type Tab = (typeof tabs)[number];
type VendorCategory = (typeof vendorCategories)[number];
type VendorStatus = (typeof vendorStatuses)[number];
type EventType = (typeof eventTypes)[number];

type Vendor = {
  id: string;
  category: VendorCategory;
  vendorName: string;
  contact: string;
  status: VendorStatus;
  quote: string;
  depositPaid: string;
  balanceDue: string;
  dueDate: string;
  notes: string;
  nextAction: string;
};

type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  type: EventType;
  vendorId: string;
  notes: string;
};

type TimelineTask = {
  id: string;
  text: string;
  done: boolean;
};

type TimelineSection = {
  id: string;
  title: string;
  tasks: TimelineTask[];
};

type VendorForm = Omit<Vendor, "id">;
type EventForm = Omit<CalendarEvent, "id">;

const emptyVendorForm: VendorForm = {
  category: "Venue",
  vendorName: "",
  contact: "",
  status: "Researching",
  quote: "",
  depositPaid: "",
  balanceDue: "",
  dueDate: "",
  notes: "",
  nextAction: "",
};

const emptyEventForm: EventForm = {
  title: "",
  date: "2026-05-20",
  type: "Vendor meeting",
  vendorId: "",
  notes: "",
};

const defaultVendors: Vendor[] = [
  {
    id: "vendor-venue",
    category: "Venue",
    vendorName: "Caversham House",
    contact: "Venue coordinator",
    status: "Confirmed",
    quote: "0",
    depositPaid: "0",
    balanceDue: "0",
    dueDate: "",
    notes: "Ceremony at Garden House, reception at Main House.",
    nextAction: "Confirm final run sheet closer to the date.",
  },
];

const defaultCalendarEvents: CalendarEvent[] = [
  {
    id: "event-florals",
    title: "Review floral direction",
    date: "2026-05-20",
    type: "Vendor meeting",
    vendorId: "",
    notes: "Check bouquet palette, ceremony florals, and reception styling.",
  },
  {
    id: "event-invites",
    title: "Invitation wording deadline",
    date: "2026-06-14",
    type: "Deadline",
    vendorId: "",
    notes: "Confirm wording before stationery design moves ahead.",
  },
  {
    id: "event-trial",
    title: "Hair and makeup trial window",
    date: "2026-08-16",
    type: "Fitting / trial",
    vendorId: "",
    notes: "Book a trial date once the artist is confirmed.",
  },
  {
    id: "event-rehearsal",
    title: "Ceremony rehearsal",
    date: "2026-10-30",
    type: "Rehearsal",
    vendorId: "vendor-venue",
    notes: "Walk through ceremony flow at Caversham House.",
  },
];

const defaultTimeline: TimelineSection[] = [
  {
    id: "now",
    title: "Now -> 9-12 months",
    tasks: [
      { id: "task-confirm-venue", text: "Confirm venue", done: true },
      { id: "task-book-photo", text: "Book photographer", done: false },
      { id: "task-shortlist-video", text: "Shortlist videographer", done: false },
      { id: "task-style-direction", text: "Confirm styling direction", done: false },
    ],
  },
  {
    id: "six-nine",
    title: "6-9 months",
    tasks: [
      { id: "task-guest-list", text: "Finalise guest list", done: false },
      { id: "task-invitations", text: "Send invitations", done: false },
      { id: "task-florist", text: "Confirm florist", done: false },
    ],
  },
  {
    id: "three-six",
    title: "3-6 months",
    tasks: [
      { id: "task-menu", text: "Confirm menu and dietary flow", done: false },
      { id: "task-trials", text: "Book fittings and trials", done: false },
      { id: "task-music", text: "Confirm ceremony and reception music", done: false },
    ],
  },
  {
    id: "one-three",
    title: "1-3 months",
    tasks: [
      { id: "task-vendor-confirmations", text: "Final vendor confirmations", done: false },
      { id: "task-seating", text: "Seating chart", done: false },
      { id: "task-final-payments", text: "Final payments", done: false },
    ],
  },
  {
    id: "final-month",
    title: "Final month",
    tasks: [
      { id: "task-run-sheet", text: "Confirm run sheet", done: false },
      { id: "task-pack-items", text: "Pack wedding day items", done: false },
      { id: "task-weather", text: "Confirm weather backup details", done: false },
    ],
  },
  {
    id: "wedding-week",
    title: "Wedding week",
    tasks: [
      { id: "task-rehearsal", text: "Ceremony rehearsal", done: false },
      { id: "task-vendor-messages", text: "Send final vendor messages", done: false },
      { id: "task-emergency-kit", text: "Prepare emergency kit", done: false },
    ],
  },
  {
    id: "wedding-day",
    title: "Wedding day",
    tasks: [
      { id: "task-rings", text: "Rings and vow cards ready", done: false },
      { id: "task-payments-day", text: "Any day-of balances handled", done: false },
      { id: "task-be-present", text: "Be present and enjoy it", done: false },
    ],
  },
];

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getPlanningAccessSnapshot() {
  if (typeof window === "undefined") {
    return false;
  }

  return sessionStorage.getItem(PLANNING_ACCESS_KEY) === "true";
}

function subscribeToPlanningAccess(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(PLANNING_ACCESS_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(PLANNING_ACCESS_EVENT, onStoreChange);
  };
}

function getLocalRawValue(key: string) {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(key);
}

function subscribeToLocalStorage(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(LOCAL_STORAGE_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(LOCAL_STORAGE_CHANGE_EVENT, onStoreChange);
  };
}

function useLocalStorageState<T>(key: string, fallback: T) {
  const rawValue = useSyncExternalStore(subscribeToLocalStorage, () => getLocalRawValue(key), () => null);
  const value = useMemo(() => {
    if (!rawValue) {
      return fallback;
    }

    try {
      return JSON.parse(rawValue) as T;
    } catch {
      return fallback;
    }
  }, [fallback, rawValue]);

  const setStoredValue = useCallback(
    (nextValue: T) => {
      if (typeof window === "undefined") {
        return;
      }

      localStorage.setItem(key, JSON.stringify(nextValue));
      window.dispatchEvent(new Event(LOCAL_STORAGE_CHANGE_EVENT));
    },
    [key],
  );

  return [value, setStoredValue] as const;
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value: string) {
  if (!value) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function parseMoney(value: string) {
  const amount = Number.parseFloat(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
}

function formatMoney(value: string) {
  const amount = parseMoney(value);

  if (!amount) {
    return "$0";
  }

  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getVendorName(vendors: Vendor[], vendorId: string) {
  return vendors.find((vendor) => vendor.id === vendorId)?.vendorName || "";
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#7d6b62]">{children}</span>;
}

function TextField({
  label,
  value,
  onChange,
  placeholder = "",
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
      <FieldLabel>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-11 rounded-2xl border border-[#eaded6] bg-white/80 px-4 text-sm text-[#3f302b] outline-none transition duration-300 ease-out placeholder:text-[#a99790] focus:border-[#b98278]"
      />
    </label>
  );
}

function PlanningCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[1.25rem] border border-[#eaded6] bg-[#fffaf7]/86 p-5 text-[#4f4641] shadow-[0_14px_34px_rgba(90,65,50,0.055)] backdrop-blur ${className}`}
    >
      {children}
    </div>
  );
}

function PlanningGate() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.trim() === PLANNING_PASSCODE) {
      sessionStorage.setItem(PLANNING_ACCESS_KEY, "true");
      window.dispatchEvent(new Event(PLANNING_ACCESS_EVENT));
      setError("");
      return;
    }

    setError("That passcode does not look quite right. Please try again.");
  }

  return (
    <main className="min-h-screen bg-[#fbf7f2] px-6 py-16 text-[#4f4641]">
      <section className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-xl flex-col items-center justify-center text-center">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-[#eaded6] bg-[#fffaf7] shadow-[0_12px_30px_rgba(90,65,50,0.06)]">
          <LockKeyhole className="h-5 w-5 text-[#b98278]" />
        </div>
        <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.42em] text-[#6e5b54]">Private Planning</p>
        <h1 className="font-serif text-5xl leading-tight text-[#b58b84] md:text-6xl">Sumaya &amp; Adi</h1>
        <p className="mt-6 text-base leading-8 text-[#6a5d55]">
          A private planning space for vendors, timelines, and upcoming wedding decisions.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-9 w-full rounded-[2rem] border border-[#eaded6] bg-[#fffaf7]/86 p-6 shadow-[0_18px_45px_rgba(90,65,50,0.07)] backdrop-blur md:p-8"
        >
          <TextField
            label="Passcode"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="Enter private passcode"
          />

          {error && <p className="mt-4 text-left text-sm leading-6 text-[#9b6f68]">{error}</p>}

          <button
            type="submit"
            className="mt-6 w-full rounded-full bg-[#3b231a] px-7 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white shadow-[0_12px_30px_rgba(59,35,26,0.18)] transition duration-300 ease-out hover:-translate-y-[1px] hover:bg-[#4a2d22]"
          >
            Enter Dashboard
          </button>
        </form>
      </section>
    </main>
  );
}

function OverviewTab({
  vendors,
  events,
  quickNotes,
  setQuickNotes,
}: {
  vendors: Vendor[];
  events: CalendarEvent[];
  quickNotes: string;
  setQuickNotes: (notes: string) => void;
}) {
  const todayKey = toDateKey(new Date());
  const confirmedVendors = vendors.filter((vendor) => ["Confirmed", "Deposit paid", "Fully paid"].includes(vendor.status));
  const paymentsDue = vendors.filter((vendor) => parseMoney(vendor.balanceDue) > 0);
  const upcomingManualEvents = events.filter((event) => event.date >= todayKey);
  const pendingDecisions = vendors.filter((vendor) =>
    ["Researching", "Contacted", "Quote received", "Shortlisted"].includes(vendor.status),
  );
  const comingUp = [
    ...upcomingManualEvents.map((event) => ({
      id: `event-${event.id}`,
      title: event.title,
      date: event.date,
      detail: event.type,
    })),
    ...vendors
      .filter((vendor) => vendor.dueDate && parseMoney(vendor.balanceDue) > 0 && vendor.dueDate >= todayKey)
      .map((vendor) => ({
        id: `vendor-${vendor.id}`,
        title: `${vendor.vendorName || vendor.category} balance due`,
        date: vendor.dueDate,
        detail: `${formatMoney(vendor.balanceDue)} remaining`,
      })),
  ]
    .sort((first, second) => first.date.localeCompare(second.date))
    .slice(0, 5);

  const summaryCards = [
    { title: "Confirmed Vendors", value: confirmedVendors.length, icon: CheckCircle2 },
    { title: "Payments Due", value: paymentsDue.length, icon: CircleDollarSign },
    { title: "Upcoming Events", value: upcomingManualEvents.length, icon: CalendarDays },
    { title: "Pending Decisions", value: pendingDecisions.length, icon: Clock3 },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <PlanningCard key={card.title}>
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[#7d6b62]">{card.title}</p>
                <p className="mt-4 font-serif text-4xl text-[#3f302b]">{card.value}</p>
              </div>
              <div className="rounded-full bg-[#f4ebe4] p-3 text-[#b98278]">
                <card.icon className="h-5 w-5" />
              </div>
            </div>
          </PlanningCard>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.92fr]">
        <PlanningCard>
          <div className="flex items-center gap-3">
            <CalendarDays className="h-5 w-5 text-[#b98278]" />
            <h2 className="font-serif text-3xl text-[#3f302b]">Coming Up</h2>
          </div>
          <div className="mt-6 space-y-4">
            {comingUp.length > 0 ? (
              comingUp.map((item) => (
                <div key={item.id} className="rounded-2xl bg-white/58 px-4 py-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-medium text-[#3f302b]">{item.title}</p>
                    <p className="text-sm font-medium text-[#b98278]">{formatDate(item.date)}</p>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-[#6a5d55]">{item.detail}</p>
                </div>
              ))
            ) : (
              <p className="text-sm leading-7 text-[#6a5d55]">No upcoming items yet. Add events or vendor due dates to build this list.</p>
            )}
          </div>
        </PlanningCard>

        <PlanningCard>
          <div className="flex items-center gap-3">
            <ClipboardList className="h-5 w-5 text-[#b98278]" />
            <h2 className="font-serif text-3xl text-[#3f302b]">Quick Notes</h2>
          </div>
          <textarea
            value={quickNotes}
            onChange={(event) => setQuickNotes(event.target.value)}
            placeholder="Small reminders, thoughts, calls to make..."
            className="mt-6 min-h-[248px] w-full resize-y rounded-[1.25rem] border border-[#eaded6] bg-white/72 p-4 text-sm leading-7 text-[#3f302b] outline-none transition duration-300 ease-out placeholder:text-[#a99790] focus:border-[#b98278]"
          />
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-[#8c7a72]">Auto-saved locally</p>
        </PlanningCard>
      </div>
    </div>
  );
}

function VendorsTab({
  vendors,
  setVendors,
  events,
  setEvents,
}: {
  vendors: Vendor[];
  setVendors: (vendors: Vendor[]) => void;
  events: CalendarEvent[];
  setEvents: (events: CalendarEvent[]) => void;
}) {
  const [form, setForm] = useState<VendorForm>(emptyVendorForm);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<"All" | VendorCategory>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | VendorStatus>("All");

  const filteredVendors = useMemo(() => {
    return vendors
      .filter((vendor) => categoryFilter === "All" || vendor.category === categoryFilter)
      .filter((vendor) => statusFilter === "All" || vendor.status === statusFilter)
      .sort((first, second) => {
        if (!first.dueDate && !second.dueDate) {
          return first.category.localeCompare(second.category);
        }

        if (!first.dueDate) {
          return 1;
        }

        if (!second.dueDate) {
          return -1;
        }

        return first.dueDate.localeCompare(second.dueDate);
      });
  }, [categoryFilter, statusFilter, vendors]);

  function resetForm() {
    setForm(emptyVendorForm);
    setEditingVendorId(null);
    setShowForm(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.vendorName.trim()) {
      return;
    }

    if (editingVendorId) {
      setVendors(vendors.map((vendor) => (vendor.id === editingVendorId ? { ...form, id: vendor.id } : vendor)));
      resetForm();
      return;
    }

    setVendors([{ ...form, id: createId("vendor") }, ...vendors]);
    resetForm();
  }

  function editVendor(vendor: Vendor) {
    setEditingVendorId(vendor.id);
    setForm({
      category: vendor.category,
      vendorName: vendor.vendorName,
      contact: vendor.contact,
      status: vendor.status,
      quote: vendor.quote,
      depositPaid: vendor.depositPaid,
      balanceDue: vendor.balanceDue,
      dueDate: vendor.dueDate,
      notes: vendor.notes,
      nextAction: vendor.nextAction,
    });
    setShowForm(true);
  }

  function deleteVendor(vendorId: string) {
    setVendors(vendors.filter((vendor) => vendor.id !== vendorId));
    setEvents(events.map((event) => (event.vendorId === vendorId ? { ...event, vendorId: "" } : event)));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-2">
            <FieldLabel>Category</FieldLabel>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value as "All" | VendorCategory)}
              className="min-h-11 rounded-2xl border border-[#eaded6] bg-[#fffaf7] px-4 text-sm outline-none focus:border-[#b98278]"
            >
              <option>All</option>
              {vendorCategories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <FieldLabel>Status</FieldLabel>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "All" | VendorStatus)}
              className="min-h-11 rounded-2xl border border-[#eaded6] bg-[#fffaf7] px-4 text-sm outline-none focus:border-[#b98278]"
            >
              <option>All</option>
              {vendorStatuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowForm(true);
            setEditingVendorId(null);
            setForm(emptyVendorForm);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#3b231a] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-[0_12px_30px_rgba(59,35,26,0.16)] transition duration-300 ease-out hover:-translate-y-[1px] hover:bg-[#4a2d22]"
        >
          <Plus className="h-4 w-4" />
          Add Vendor
        </button>
      </div>

      {showForm && (
        <PlanningCard>
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#7d6b62]">
                {editingVendorId ? "Edit Vendor" : "Add Vendor"}
              </p>
              <h2 className="mt-2 font-serif text-3xl text-[#3f302b]">Vendor Details</h2>
            </div>
            <button type="button" onClick={resetForm} aria-label="Close vendor form" className="rounded-full p-2 text-[#7d6b62] hover:bg-[#f4ebe4]">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="grid gap-2">
              <FieldLabel>Category</FieldLabel>
              <select
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value as VendorCategory })}
                className="min-h-11 rounded-2xl border border-[#eaded6] bg-white/80 px-4 text-sm outline-none focus:border-[#b98278]"
              >
                {vendorCategories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
            <TextField label="Vendor Name" value={form.vendorName} onChange={(vendorName) => setForm({ ...form, vendorName })} />
            <TextField label="Contact" value={form.contact} onChange={(contact) => setForm({ ...form, contact })} />
            <label className="grid gap-2">
              <FieldLabel>Status</FieldLabel>
              <select
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value as VendorStatus })}
                className="min-h-11 rounded-2xl border border-[#eaded6] bg-white/80 px-4 text-sm outline-none focus:border-[#b98278]"
              >
                {vendorStatuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>
            <TextField label="Quote" value={form.quote} onChange={(quote) => setForm({ ...form, quote })} placeholder="$" />
            <TextField
              label="Deposit Paid"
              value={form.depositPaid}
              onChange={(depositPaid) => setForm({ ...form, depositPaid })}
              placeholder="$"
            />
            <TextField
              label="Balance Due"
              value={form.balanceDue}
              onChange={(balanceDue) => setForm({ ...form, balanceDue })}
              placeholder="$"
            />
            <TextField label="Due Date" type="date" value={form.dueDate} onChange={(dueDate) => setForm({ ...form, dueDate })} />
            <TextField label="Next Action" value={form.nextAction} onChange={(nextAction) => setForm({ ...form, nextAction })} />
            <label className="grid gap-2 md:col-span-2 xl:col-span-3">
              <FieldLabel>Notes</FieldLabel>
              <textarea
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                className="min-h-24 rounded-2xl border border-[#eaded6] bg-white/80 px-4 py-3 text-sm leading-6 outline-none focus:border-[#b98278]"
              />
            </label>
            <div className="flex gap-3 md:col-span-2 xl:col-span-3">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-[#3b231a] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-[0_12px_30px_rgba(59,35,26,0.16)] transition duration-300 ease-out hover:-translate-y-[1px] hover:bg-[#4a2d22]"
              >
                <Save className="h-4 w-4" />
                {editingVendorId ? "Update Vendor" : "Save Vendor"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-[#eaded6] bg-[#fffaf7] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#6a5d55] transition hover:border-[#b98278]"
              >
                Cancel
              </button>
            </div>
          </form>
        </PlanningCard>
      )}

      <div className="hidden overflow-hidden rounded-[1.25rem] border border-[#eaded6] bg-[#fffaf7]/86 shadow-[0_14px_34px_rgba(90,65,50,0.055)] md:block">
        <div className="overflow-x-auto">
          <table className="min-w-[1180px] w-full text-left text-sm">
            <thead className="bg-[#f4ebe4]/72 text-[11px] uppercase tracking-[0.18em] text-[#7d6b62]">
              <tr>
                {["Category", "Vendor Name", "Contact", "Status", "Quote", "Deposit Paid", "Balance Due", "Due Date", "Notes", "Next Action", ""].map(
                  (heading) => (
                    <th key={heading} className="px-4 py-4 font-medium">
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaded6]/80">
              {filteredVendors.map((vendor) => (
                <tr key={vendor.id} className="align-top">
                  <td className="px-4 py-4">{vendor.category}</td>
                  <td className="px-4 py-4 font-medium text-[#3f302b]">{vendor.vendorName}</td>
                  <td className="px-4 py-4">{vendor.contact || "Not set"}</td>
                  <td className="px-4 py-4">
                    <span className="rounded-full bg-[#f4ebe4] px-3 py-1 text-xs text-[#6a5d55]">{vendor.status}</span>
                  </td>
                  <td className="px-4 py-4">{formatMoney(vendor.quote)}</td>
                  <td className="px-4 py-4">{formatMoney(vendor.depositPaid)}</td>
                  <td className="px-4 py-4">{formatMoney(vendor.balanceDue)}</td>
                  <td className="px-4 py-4">{vendor.dueDate ? formatDate(vendor.dueDate) : "Not set"}</td>
                  <td className="max-w-[220px] px-4 py-4 text-[#6a5d55]">{vendor.notes || "Not set"}</td>
                  <td className="max-w-[220px] px-4 py-4 text-[#6a5d55]">{vendor.nextAction || "Not set"}</td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => editVendor(vendor)} className="rounded-full p-2 text-[#b98278] hover:bg-[#f4ebe4]" aria-label={`Edit ${vendor.vendorName}`}>
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => deleteVendor(vendor.id)} className="rounded-full p-2 text-[#9b6f68] hover:bg-[#f4ebe4]" aria-label={`Delete ${vendor.vendorName}`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 md:hidden">
        {filteredVendors.map((vendor) => (
          <PlanningCard key={vendor.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-[#7d6b62]">{vendor.category}</p>
                <h3 className="mt-2 font-serif text-2xl text-[#3f302b]">{vendor.vendorName}</h3>
              </div>
              <span className="rounded-full bg-[#f4ebe4] px-3 py-1 text-xs text-[#6a5d55]">{vendor.status}</span>
            </div>
            <div className="mt-5 grid gap-3 text-sm text-[#6a5d55]">
              <p>Contact: {vendor.contact || "Not set"}</p>
              <p>Quote: {formatMoney(vendor.quote)} | Deposit: {formatMoney(vendor.depositPaid)}</p>
              <p>Balance: {formatMoney(vendor.balanceDue)} | Due: {vendor.dueDate ? formatDate(vendor.dueDate) : "Not set"}</p>
              {vendor.nextAction && <p>Next: {vendor.nextAction}</p>}
              {vendor.notes && <p>Notes: {vendor.notes}</p>}
            </div>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => editVendor(vendor)} className="inline-flex items-center gap-2 rounded-full border border-[#eaded6] px-4 py-2 text-xs uppercase tracking-[0.14em] text-[#6a5d55]">
                <Pencil className="h-4 w-4" />
                Edit
              </button>
              <button type="button" onClick={() => deleteVendor(vendor.id)} className="inline-flex items-center gap-2 rounded-full border border-[#eaded6] px-4 py-2 text-xs uppercase tracking-[0.14em] text-[#9b6f68]">
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </PlanningCard>
        ))}
      </div>
    </div>
  );
}

function CalendarTab({
  vendors,
  events,
  setEvents,
}: {
  vendors: Vendor[];
  events: CalendarEvent[];
  setEvents: (events: CalendarEvent[]) => void;
}) {
  const [viewDate, setViewDate] = useState(() => new Date(2026, 4, 1));
  const [selectedDate, setSelectedDate] = useState("2026-05-20");
  const [eventForm, setEventForm] = useState<EventForm>(emptyEventForm);
  const monthStart = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const startOffset = monthStart.getDay();
  const calendarCells = [
    ...Array.from({ length: startOffset }, (_, index) => ({ key: `blank-${index}`, date: "", day: "" })),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), index + 1);
      return { key: toDateKey(date), date: toDateKey(date), day: String(index + 1) };
    }),
  ];

  const vendorDueEvents = vendors
    .filter((vendor) => vendor.dueDate)
    .map((vendor) => ({
      id: `due-${vendor.id}`,
      title: `${vendor.vendorName || vendor.category} payment due`,
      date: vendor.dueDate,
      type: "Payment due" as EventType,
      vendorId: vendor.id,
      notes: vendor.balanceDue ? `${formatMoney(vendor.balanceDue)} balance due.` : "Vendor due date.",
      isVendorDue: true,
    }));
  const allEvents = [...events.map((event) => ({ ...event, isVendorDue: false })), ...vendorDueEvents];
  const selectedEvents = allEvents.filter((event) => event.date === selectedDate);

  function changeMonth(offset: number) {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  }

  function addEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!eventForm.title.trim() || !eventForm.date) {
      return;
    }

    setEvents([{ ...eventForm, id: createId("event") }, ...events]);
    setSelectedDate(eventForm.date);
    setEventForm({ ...emptyEventForm, date: eventForm.date });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <PlanningCard>
        <div className="mb-5 flex items-center justify-between gap-4">
          <button type="button" onClick={() => changeMonth(-1)} aria-label="Previous month" className="rounded-full border border-[#eaded6] bg-white/60 p-2 text-[#6a5d55] hover:border-[#b98278]">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-center font-serif text-3xl text-[#3f302b]">
            {new Intl.DateTimeFormat("en-AU", { month: "long", year: "numeric" }).format(monthStart)}
          </h2>
          <button type="button" onClick={() => changeMonth(1)} aria-label="Next month" className="rounded-full border border-[#eaded6] bg-white/60 p-2 text-[#6a5d55] hover:border-[#b98278]">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-medium uppercase tracking-[0.16em] text-[#7d6b62]">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {calendarCells.map((cell) => {
            const dayEvents = allEvents.filter((event) => event.date === cell.date);
            const selected = selectedDate === cell.date;

            return (
              <button
                key={cell.key}
                type="button"
                disabled={!cell.date}
                onClick={() => setSelectedDate(cell.date)}
                className={`min-h-20 rounded-2xl border p-2 text-left transition duration-300 ease-out ${
                  selected
                    ? "border-[#b98278] bg-[#f4ebe4]"
                    : cell.date
                      ? "border-[#eaded6] bg-white/56 hover:border-[#b98278]/70"
                      : "border-transparent"
                }`}
              >
                <span className="text-sm font-medium text-[#3f302b]">{cell.day}</span>
                {dayEvents.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {dayEvents.slice(0, 3).map((event) => (
                      <span key={event.id} className="h-1.5 w-1.5 rounded-full bg-[#b98278]" />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </PlanningCard>

      <div className="space-y-6">
        <PlanningCard>
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#7d6b62]">Selected Date</p>
          <h2 className="mt-2 font-serif text-3xl text-[#3f302b]">{formatDate(selectedDate)}</h2>
          <div className="mt-5 space-y-3">
            {selectedEvents.length > 0 ? (
              selectedEvents.map((event) => (
                <div key={event.id} className="rounded-2xl bg-white/62 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-[#3f302b]">{event.title}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#b98278]">{event.type}</p>
                    </div>
                    {!event.isVendorDue && (
                      <button type="button" onClick={() => setEvents(events.filter((item) => item.id !== event.id))} aria-label={`Delete ${event.title}`} className="rounded-full p-1.5 text-[#9b6f68] hover:bg-[#f4ebe4]">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {event.vendorId && <p className="mt-2 text-sm text-[#6a5d55]">Vendor: {getVendorName(vendors, event.vendorId) || "Linked vendor"}</p>}
                  {event.notes && <p className="mt-2 text-sm leading-6 text-[#6a5d55]">{event.notes}</p>}
                </div>
              ))
            ) : (
              <p className="text-sm leading-7 text-[#6a5d55]">No events on this date yet.</p>
            )}
          </div>
        </PlanningCard>

        <PlanningCard>
          <h2 className="font-serif text-3xl text-[#3f302b]">Add Event</h2>
          <form onSubmit={addEvent} className="mt-5 grid gap-4">
            <TextField label="Title" value={eventForm.title} onChange={(title) => setEventForm({ ...eventForm, title })} />
            <TextField label="Date" type="date" value={eventForm.date} onChange={(date) => setEventForm({ ...eventForm, date })} />
            <label className="grid gap-2">
              <FieldLabel>Type</FieldLabel>
              <select
                value={eventForm.type}
                onChange={(event) => setEventForm({ ...eventForm, type: event.target.value as EventType })}
                className="min-h-11 rounded-2xl border border-[#eaded6] bg-white/80 px-4 text-sm outline-none focus:border-[#b98278]"
              >
                {eventTypes.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <FieldLabel>Linked Vendor</FieldLabel>
              <select
                value={eventForm.vendorId}
                onChange={(event) => setEventForm({ ...eventForm, vendorId: event.target.value })}
                className="min-h-11 rounded-2xl border border-[#eaded6] bg-white/80 px-4 text-sm outline-none focus:border-[#b98278]"
              >
                <option value="">Optional</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.vendorName}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <FieldLabel>Notes</FieldLabel>
              <textarea
                value={eventForm.notes}
                onChange={(event) => setEventForm({ ...eventForm, notes: event.target.value })}
                className="min-h-24 rounded-2xl border border-[#eaded6] bg-white/80 px-4 py-3 text-sm leading-6 outline-none focus:border-[#b98278]"
              />
            </label>
            <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#3b231a] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-[0_12px_30px_rgba(59,35,26,0.16)] transition duration-300 ease-out hover:-translate-y-[1px] hover:bg-[#4a2d22]">
              <Plus className="h-4 w-4" />
              Add Event
            </button>
          </form>
        </PlanningCard>
      </div>
    </div>
  );
}

function TimelineTab({
  timeline,
  setTimeline,
}: {
  timeline: TimelineSection[];
  setTimeline: (timeline: TimelineSection[]) => void;
}) {
  const [newTaskText, setNewTaskText] = useState<Record<string, string>>({});

  function toggleTask(sectionId: string, taskId: string) {
    setTimeline(
      timeline.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              tasks: section.tasks.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task)),
            }
          : section,
      ),
    );
  }

  function addTask(sectionId: string) {
    const text = newTaskText[sectionId]?.trim();

    if (!text) {
      return;
    }

    setTimeline(
      timeline.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              tasks: [...section.tasks, { id: createId("task"), text, done: false }],
            }
          : section,
      ),
    );
    setNewTaskText({ ...newTaskText, [sectionId]: "" });
  }

  function deleteTask(sectionId: string, taskId: string) {
    setTimeline(
      timeline.map((section) =>
        section.id === sectionId ? { ...section, tasks: section.tasks.filter((task) => task.id !== taskId) } : section,
      ),
    );
  }

  return (
    <div className="relative mx-auto max-w-4xl">
      <div className="absolute bottom-0 left-4 top-0 hidden w-px bg-[#eaded6] md:block" />
      <div className="space-y-6">
        {timeline.map((section) => (
          <div key={section.id} className="relative md:pl-12">
            <div className="absolute left-[9px] top-7 hidden h-3.5 w-3.5 rounded-full bg-[#b98278] ring-4 ring-[#fbf7f2] md:block" />
            <PlanningCard>
              <h2 className="font-serif text-3xl text-[#3f302b]">{section.title}</h2>
              <div className="mt-5 space-y-3">
                {section.tasks.map((task) => (
                  <div key={task.id} className="flex items-start justify-between gap-3 rounded-2xl bg-white/60 px-4 py-3">
                    <label className="flex flex-1 cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={task.done}
                        onChange={() => toggleTask(section.id, task.id)}
                        className="mt-1 h-4 w-4 accent-[#b98278]"
                      />
                      <span className={`text-sm leading-6 ${task.done ? "text-[#8c7a72] line-through" : "text-[#4f4641]"}`}>{task.text}</span>
                    </label>
                    <button type="button" onClick={() => deleteTask(section.id, task.id)} aria-label={`Delete ${task.text}`} className="rounded-full p-1.5 text-[#9b6f68] hover:bg-[#f4ebe4]">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={newTaskText[section.id] ?? ""}
                  onChange={(event) => setNewTaskText({ ...newTaskText, [section.id]: event.target.value })}
                  placeholder="Add custom task"
                  className="min-h-11 flex-1 rounded-2xl border border-[#eaded6] bg-white/80 px-4 text-sm outline-none focus:border-[#b98278]"
                />
                <button
                  type="button"
                  onClick={() => addTask(section.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[#eaded6] bg-[#fffaf7] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#6a5d55] transition hover:border-[#b98278]"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
            </PlanningCard>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotesTab({ decisionNotes, setDecisionNotes }: { decisionNotes: string; setDecisionNotes: (notes: string) => void }) {
  return (
    <PlanningCard>
      <div className="max-w-3xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#7d6b62]">Notes</p>
        <h2 className="mt-2 font-serif text-4xl text-[#3f302b]">Decision Notes</h2>
        <p className="mt-4 text-[15px] leading-7 text-[#6a5d55]">
          Use this for vendor comparisons, negotiation notes, ideas, and decisions you want to revisit.
        </p>
      </div>
      <textarea
        value={decisionNotes}
        onChange={(event) => setDecisionNotes(event.target.value)}
        placeholder="Vendor comparisons, thoughts, negotiations, ideas..."
        className="mt-7 min-h-[460px] w-full resize-y rounded-[1.25rem] border border-[#eaded6] bg-white/72 p-5 text-sm leading-7 text-[#3f302b] outline-none transition duration-300 ease-out placeholder:text-[#a99790] focus:border-[#b98278]"
      />
      <p className="mt-3 text-xs uppercase tracking-[0.2em] text-[#8c7a72]">Auto-saved locally</p>
    </PlanningCard>
  );
}

function PlanningDashboardContent() {
  const shouldReduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [vendors, setVendors] = useLocalStorageState(VENDORS_KEY, defaultVendors);
  const [events, setEvents] = useLocalStorageState(EVENTS_KEY, defaultCalendarEvents);
  const [timeline, setTimeline] = useLocalStorageState(TIMELINE_KEY, defaultTimeline);
  const [quickNotes, setQuickNotes] = useLocalStorageState(QUICK_NOTES_KEY, "");
  const [decisionNotes, setDecisionNotes] = useLocalStorageState(DECISION_NOTES_KEY, "");
  const reveal = {
    initial: shouldReduceMotion ? false : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: shouldReduceMotion ? 0 : 0.55, ease: revealEase },
  };

  const renderTab = useCallback(() => {
    if (activeTab === "Overview") {
      return <OverviewTab vendors={vendors} events={events} quickNotes={quickNotes} setQuickNotes={setQuickNotes} />;
    }

    if (activeTab === "Vendors") {
      return <VendorsTab vendors={vendors} setVendors={setVendors} events={events} setEvents={setEvents} />;
    }

    if (activeTab === "Calendar") {
      return <CalendarTab vendors={vendors} events={events} setEvents={setEvents} />;
    }

    if (activeTab === "Timeline") {
      return <TimelineTab timeline={timeline} setTimeline={setTimeline} />;
    }

    return <NotesTab decisionNotes={decisionNotes} setDecisionNotes={setDecisionNotes} />;
  }, [activeTab, decisionNotes, events, quickNotes, setDecisionNotes, setEvents, setQuickNotes, setTimeline, setVendors, timeline, vendors]);

  return (
    <main className="min-h-screen bg-[#fbf7f2] px-5 py-8 text-[#4f4641] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <motion.header {...reveal} className="relative overflow-hidden rounded-[2rem] border border-[#eaded6] bg-[#fffaf7]/82 px-6 py-10 shadow-[0_18px_45px_rgba(90,65,50,0.06)] md:px-10 md:py-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(232,174,168,0.14),transparent_32%),radial-gradient(circle_at_86%_70%,rgba(232,215,189,0.20),transparent_34%)]" />
          <div className="relative">
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.42em] text-[#6e5b54]">Private Planning</p>
            <h1 className="font-serif text-5xl leading-tight text-[#b58b84] md:text-7xl">Sumaya &amp; Adi</h1>
            <p className="mt-5 max-w-2xl text-[16px] leading-8 text-[#6a5d55]">
              A private space for managing vendors, timelines, and upcoming plans.
            </p>
          </div>
        </motion.header>

        <div className="sticky top-0 z-20 -mx-5 mt-6 bg-[#fbf7f2]/92 px-5 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto rounded-full border border-[#eaded6] bg-[#fffaf7]/86 p-2 shadow-[0_10px_28px_rgba(90,65,50,0.045)]">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap rounded-full px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] transition duration-300 ease-out ${
                  activeTab === tab ? "bg-[#3b231a] text-white shadow-[0_10px_24px_rgba(59,35,26,0.13)]" : "text-[#6a5d55] hover:bg-[#f4ebe4] hover:text-[#3f302b]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <motion.section
          key={activeTab}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.45, ease: revealEase }}
          className="mt-5 pb-14"
        >
          {renderTab()}
        </motion.section>
      </section>
    </main>
  );
}

export default function PrivatePlanningDashboard() {
  const unlocked = useSyncExternalStore(subscribeToPlanningAccess, getPlanningAccessSnapshot, () => false);

  if (!unlocked) {
    return <PlanningGate />;
  }

  return <PlanningDashboardContent />;
}
