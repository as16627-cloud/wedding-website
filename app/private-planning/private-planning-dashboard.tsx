"use client";

import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  useCallback,
  useMemo,
  useRef,
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
  Download,
  FileText,
  LockKeyhole,
  MessageSquareText,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";

const PLANNING_PASSCODE = "caversham2026";
const PLANNING_ACCESS_KEY = "private-planning-access";
const PLANNING_ACCESS_EVENT = "private-planning-access-change";
const LOCAL_STORAGE_CHANGE_EVENT = "private-planning-local-storage-change";

const VENDORS_KEY = "private-planning-vendors";
const EVENTS_KEY = "private-planning-calendar-events";
const TASKS_KEY = "private-planning-tasks";
const TIMELINE_KEY = "private-planning-timeline";
const QUICK_NOTES_KEY = "private-planning-quick-notes";
const NOTES_KEY = "private-planning-notes";
const LEGACY_DECISION_NOTES_KEY = "private-planning-decision-notes";

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
const priorities = ["Low", "Medium", "High"] as const;
const contactMethods = ["Email", "Phone", "Instagram", "Website"] as const;
const eventTypes = ["Meeting", "Payment", "Follow-up", "Deadline", "Appointment"] as const;
const taskStatuses = ["To do", "In progress", "Waiting", "Done"] as const;
const paymentFilters = ["All", "Paid", "Balance due", "Overdue", "Due in 14 days"] as const;
const sortOptions = ["Due date", "Balance due", "Status", "Vendor name"] as const;

type Tab = (typeof tabs)[number];
type VendorCategory = (typeof vendorCategories)[number];
type VendorStatus = (typeof vendorStatuses)[number];
type Priority = (typeof priorities)[number];
type ContactMethod = (typeof contactMethods)[number];
type EventType = (typeof eventTypes)[number];
type TaskStatus = (typeof taskStatuses)[number];
type PaymentFilter = (typeof paymentFilters)[number];
type SortOption = (typeof sortOptions)[number];

type CommunicationLog = {
  id: string;
  date: string;
  method: ContactMethod;
  summary: string;
  nextFollowUp: string;
};

type Vendor = {
  id: string;
  category: VendorCategory;
  vendorName: string;
  contact: string;
  email: string;
  phone: string;
  instagram: string;
  website: string;
  contactMethod: ContactMethod;
  priority: Priority;
  status: VendorStatus;
  contractSigned: "Yes" | "No";
  quote: string;
  depositPaid: string;
  balanceDue: string;
  dueDate: string;
  depositDueDate: string;
  finalPaymentDueDate: string;
  lastContactedDate: string;
  followUpDate: string;
  notes: string;
  nextAction: string;
  filesLinks: string;
  communicationLog: CommunicationLog[];
};

type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  type: EventType;
  vendorId: string;
  notes: string;
};

type PlanningTask = {
  id: string;
  title: string;
  vendorId: string;
  category: VendorCategory | "";
  dueDate: string;
  priority: Priority;
  status: TaskStatus;
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

type PlanningNotes = {
  decision: string;
  budget: string;
  design: string;
  venueQuestions: string;
  vendorQuestions: string;
};

type VendorForm = Omit<Vendor, "id" | "communicationLog">;
type EventForm = Omit<CalendarEvent, "id">;
type TaskForm = Omit<PlanningTask, "id">;
type LogForm = Omit<CommunicationLog, "id">;

const emptyVendorForm: VendorForm = {
  category: "Venue",
  vendorName: "",
  contact: "",
  email: "",
  phone: "",
  instagram: "",
  website: "",
  contactMethod: "Email",
  priority: "Medium",
  status: "Researching",
  contractSigned: "No",
  quote: "",
  depositPaid: "",
  balanceDue: "",
  dueDate: "",
  depositDueDate: "",
  finalPaymentDueDate: "",
  lastContactedDate: "",
  followUpDate: "",
  notes: "",
  nextAction: "",
  filesLinks: "",
};

const emptyEventForm: EventForm = {
  title: "",
  date: "2026-05-20",
  type: "Meeting",
  vendorId: "",
  notes: "",
};

const emptyTaskForm: TaskForm = {
  title: "",
  vendorId: "",
  category: "",
  dueDate: "",
  priority: "Medium",
  status: "To do",
  notes: "",
};

const emptyLogForm: LogForm = {
  date: "",
  method: "Email",
  summary: "",
  nextFollowUp: "",
};

const defaultNotes: PlanningNotes = {
  decision: "",
  budget: "",
  design: "",
  venueQuestions: "",
  vendorQuestions: "",
};

const defaultVendors: Vendor[] = [
  {
    ...emptyVendorForm,
    id: "vendor-venue",
    category: "Venue",
    vendorName: "Caversham House",
    contact: "Venue coordinator",
    email: "",
    website: "https://www.cavershamhouse.com.au",
    contactMethod: "Email",
    priority: "High",
    status: "Confirmed",
    contractSigned: "Yes",
    notes: "Ceremony at Garden House, reception at Main House.",
    nextAction: "Confirm final run sheet closer to the date.",
    communicationLog: [
      {
        id: "log-venue-1",
        date: "2026-05-12",
        method: "Email",
        summary: "Confirmed ceremony location and reception flow.",
        nextFollowUp: "2026-08-01",
      },
    ],
  },
];

const defaultCalendarEvents: CalendarEvent[] = [
  {
    id: "event-florals",
    title: "Review floral direction",
    date: "2026-05-20",
    type: "Meeting",
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
    type: "Appointment",
    vendorId: "",
    notes: "Book a trial date once the artist is confirmed.",
  },
  {
    id: "event-rehearsal",
    title: "Ceremony rehearsal",
    date: "2026-10-30",
    type: "Meeting",
    vendorId: "vendor-venue",
    notes: "Walk through ceremony flow at Caversham House.",
  },
];

const defaultTasks: PlanningTask[] = [
  {
    id: "task-book-photographer",
    title: "Shortlist and book photographer",
    vendorId: "",
    category: "Photography",
    dueDate: "2026-05-30",
    priority: "High",
    status: "To do",
    notes: "Compare portfolios and packages.",
  },
  {
    id: "task-florist-follow-up",
    title: "Follow up on bouquet quote",
    vendorId: "",
    category: "Florist",
    dueDate: "2026-05-24",
    priority: "Medium",
    status: "Waiting",
    notes: "",
  },
];

const defaultTimeline: TimelineSection[] = [
  {
    id: "now",
    title: "Now",
    tasks: [
      { id: "task-confirm-venue", text: "Confirm venue", done: true },
      { id: "task-book-photo", text: "Book photographer", done: false },
      { id: "task-style-direction", text: "Confirm styling direction", done: false },
    ],
  },
  {
    id: "twelve-months",
    title: "12 months out",
    tasks: [
      { id: "task-budget", text: "Confirm planning budget", done: false },
      { id: "task-guest-list", text: "Draft guest list", done: false },
    ],
  },
  {
    id: "nine-months",
    title: "9 months out",
    tasks: [
      { id: "task-video", text: "Book videographer", done: false },
      { id: "task-florist", text: "Confirm florist", done: false },
      { id: "task-save-dates", text: "Send save the dates or website link", done: false },
    ],
  },
  {
    id: "six-months",
    title: "6 months out",
    tasks: [
      { id: "task-invitations", text: "Send invitations", done: false },
      { id: "task-menu", text: "Confirm menu and dietary flow", done: false },
      { id: "task-entertainment", text: "Confirm DJ or entertainment", done: false },
    ],
  },
  {
    id: "three-months",
    title: "3 months out",
    tasks: [
      { id: "task-trials", text: "Book fittings, tastings, and trials", done: false },
      { id: "task-rsvp", text: "Review RSVP responses", done: false },
      { id: "task-transport", text: "Confirm transport plan", done: false },
    ],
  },
  {
    id: "one-month",
    title: "1 month out",
    tasks: [
      { id: "task-vendor-confirmations", text: "Final vendor confirmations", done: false },
      { id: "task-seating", text: "Seating chart", done: false },
      { id: "task-final-payments", text: "Final payments", done: false },
    ],
  },
  {
    id: "wedding-week",
    title: "Wedding week",
    tasks: [
      { id: "task-rehearsal", text: "Ceremony rehearsal", done: false },
      { id: "task-vendor-messages", text: "Send final vendor messages", done: false },
      { id: "task-pack-items", text: "Pack wedding day items", done: false },
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

function todayKey() {
  return toDateKey(new Date());
}

function formatDate(value?: string) {
  if (!value) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function daysUntil(value?: string) {
  if (!value) {
    return Number.POSITIVE_INFINITY;
  }

  const current = new Date(`${todayKey()}T00:00:00`).getTime();
  const target = new Date(`${value}T00:00:00`).getTime();
  return Math.ceil((target - current) / 86_400_000);
}

function parseMoney(value?: string | null) {
  const amount = Number.parseFloat(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(amount) ? amount : 0;
}

function formatMoney(value?: string | null) {
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

function isOneOf<T extends readonly string[]>(value: unknown, options: T): value is T[number] {
  return typeof value === "string" && options.includes(value);
}

function normalizeVendor(raw: Partial<Vendor> & Record<string, unknown>): Vendor {
  return {
    ...emptyVendorForm,
    id: typeof raw.id === "string" ? raw.id : createId("vendor"),
    category: isOneOf(raw.category, vendorCategories) ? raw.category : "Venue",
    vendorName: typeof raw.vendorName === "string" ? raw.vendorName : "",
    contact: typeof raw.contact === "string" ? raw.contact : "",
    email: typeof raw.email === "string" ? raw.email : "",
    phone: typeof raw.phone === "string" ? raw.phone : "",
    instagram: typeof raw.instagram === "string" ? raw.instagram : "",
    website: typeof raw.website === "string" ? raw.website : "",
    contactMethod: isOneOf(raw.contactMethod, contactMethods) ? raw.contactMethod : "Email",
    priority: isOneOf(raw.priority, priorities) ? raw.priority : "Medium",
    status: isOneOf(raw.status, vendorStatuses) ? raw.status : "Researching",
    contractSigned: raw.contractSigned === "Yes" ? "Yes" : "No",
    quote: typeof raw.quote === "string" ? raw.quote : String(raw.quote ?? ""),
    depositPaid: typeof raw.depositPaid === "string" ? raw.depositPaid : String(raw.depositPaid ?? ""),
    balanceDue: typeof raw.balanceDue === "string" ? raw.balanceDue : String(raw.balanceDue ?? ""),
    dueDate: typeof raw.dueDate === "string" ? raw.dueDate : "",
    depositDueDate: typeof raw.depositDueDate === "string" ? raw.depositDueDate : "",
    finalPaymentDueDate: typeof raw.finalPaymentDueDate === "string" ? raw.finalPaymentDueDate : "",
    lastContactedDate: typeof raw.lastContactedDate === "string" ? raw.lastContactedDate : "",
    followUpDate: typeof raw.followUpDate === "string" ? raw.followUpDate : "",
    notes: typeof raw.notes === "string" ? raw.notes : "",
    nextAction: typeof raw.nextAction === "string" ? raw.nextAction : "",
    filesLinks: typeof raw.filesLinks === "string" ? raw.filesLinks : "",
    communicationLog: Array.isArray(raw.communicationLog)
      ? raw.communicationLog.map((log) => normalizeLog(log as Partial<CommunicationLog> & Record<string, unknown>))
      : [],
  };
}

function normalizeLog(raw: Partial<CommunicationLog> & Record<string, unknown>): CommunicationLog {
  return {
    id: typeof raw.id === "string" ? raw.id : createId("log"),
    date: typeof raw.date === "string" ? raw.date : "",
    method: isOneOf(raw.method, contactMethods) ? raw.method : "Email",
    summary: typeof raw.summary === "string" ? raw.summary : "",
    nextFollowUp: typeof raw.nextFollowUp === "string" ? raw.nextFollowUp : "",
  };
}

function normalizeVendors(value: unknown): Vendor[] {
  return Array.isArray(value) ? value.map((vendor) => normalizeVendor(vendor as Partial<Vendor> & Record<string, unknown>)) : defaultVendors;
}

function normalizeEvent(raw: Partial<CalendarEvent> & Record<string, unknown>): CalendarEvent {
  const rawRecord: Record<string, unknown> = raw;
  const rawType = typeof rawRecord.type === "string" ? rawRecord.type : "";
  const legacyType =
    rawType === "Vendor meeting"
      ? "Meeting"
      : rawType === "Payment due"
        ? "Payment"
        : rawType === "Fitting / trial" || rawType === "Rehearsal"
          ? "Appointment"
          : rawType;

  return {
    id: typeof raw.id === "string" ? raw.id : createId("event"),
    title: typeof raw.title === "string" ? raw.title : "",
    date: typeof raw.date === "string" ? raw.date : "",
    type: isOneOf(legacyType, eventTypes) ? legacyType : "Meeting",
    vendorId: typeof raw.vendorId === "string" ? raw.vendorId : "",
    notes: typeof raw.notes === "string" ? raw.notes : "",
  };
}

function normalizeEvents(value: unknown): CalendarEvent[] {
  return Array.isArray(value) ? value.map((event) => normalizeEvent(event as Partial<CalendarEvent> & Record<string, unknown>)) : defaultCalendarEvents;
}

function normalizeTasks(value: unknown): PlanningTask[] {
  if (!Array.isArray(value)) {
    return defaultTasks;
  }

  return value.map((raw) => {
    const task = raw as Partial<PlanningTask> & Record<string, unknown>;
    return {
      id: typeof task.id === "string" ? task.id : createId("planning-task"),
      title: typeof task.title === "string" ? task.title : "",
      vendorId: typeof task.vendorId === "string" ? task.vendorId : "",
      category: isOneOf(task.category, vendorCategories) ? task.category : "",
      dueDate: typeof task.dueDate === "string" ? task.dueDate : "",
      priority: isOneOf(task.priority, priorities) ? task.priority : "Medium",
      status: isOneOf(task.status, taskStatuses) ? task.status : "To do",
      notes: typeof task.notes === "string" ? task.notes : "",
    };
  });
}

function normalizeTimeline(value: unknown): TimelineSection[] {
  if (!Array.isArray(value)) {
    return defaultTimeline;
  }

  const byId = new Map(
    value
      .filter((section): section is Partial<TimelineSection> & Record<string, unknown> => typeof section === "object" && section !== null)
      .map((section) => [typeof section.id === "string" ? section.id : "", section]),
  );

  return defaultTimeline.map((fallbackSection) => {
    const saved = byId.get(fallbackSection.id);
    if (!saved || !Array.isArray(saved.tasks)) {
      return fallbackSection;
    }

    return {
      ...fallbackSection,
      tasks: saved.tasks.map((task) => {
        const raw = task as Partial<TimelineTask>;
        return {
          id: typeof raw.id === "string" ? raw.id : createId("timeline-task"),
          text: typeof raw.text === "string" ? raw.text : "",
          done: Boolean(raw.done),
        };
      }),
    };
  });
}

function normalizeNotes(value: unknown, legacyDecisionNotes = ""): PlanningNotes {
  if (typeof value !== "object" || value === null) {
    return { ...defaultNotes, decision: legacyDecisionNotes };
  }

  const raw = value as Partial<PlanningNotes>;
  return {
    decision: typeof raw.decision === "string" ? raw.decision : legacyDecisionNotes,
    budget: typeof raw.budget === "string" ? raw.budget : "",
    design: typeof raw.design === "string" ? raw.design : "",
    venueQuestions: typeof raw.venueQuestions === "string" ? raw.venueQuestions : "",
    vendorQuestions: typeof raw.vendorQuestions === "string" ? raw.vendorQuestions : "",
  };
}

function getVendorName(vendors: Vendor[], vendorId: string) {
  return vendors.find((vendor) => vendor.id === vendorId)?.vendorName || "";
}

function getNextVendorDueDate(vendor: Vendor) {
  return [vendor.depositDueDate, vendor.finalPaymentDueDate, vendor.dueDate].filter(Boolean).sort()[0] ?? "";
}

function getDueTone(date?: string) {
  const days = daysUntil(date);

  if (!date) {
    return "muted";
  }

  if (days < 0) {
    return "overdue";
  }

  if (days <= 14) {
    return "upcoming";
  }

  return "normal";
}

function getPaymentStatus(vendor: Vendor): PaymentFilter {
  const balance = parseMoney(vendor.balanceDue);
  const dueDate = getNextVendorDueDate(vendor);
  const days = daysUntil(dueDate);

  if (balance <= 0 || vendor.status === "Fully paid") {
    return "Paid";
  }

  if (days < 0) {
    return "Overdue";
  }

  if (days <= 14) {
    return "Due in 14 days";
  }

  return "Balance due";
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
      <FieldLabel>{label}</FieldLabel>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="min-h-11 rounded-2xl border border-[#eaded6] bg-white/80 px-4 text-sm text-[#3f302b] outline-none transition duration-300 ease-out focus:border-[#b98278]"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
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

function Chip({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "rose" | "sage" | "champagne" | "navy" }) {
  const toneClass =
    tone === "rose"
      ? "bg-[#f8e8e4] text-[#9b6f68]"
      : tone === "sage"
        ? "bg-[#eef5e9] text-[#52634a]"
        : tone === "champagne"
          ? "bg-[#f5ead7] text-[#8a6c45]"
          : tone === "navy"
            ? "bg-[var(--color-navy)] text-[var(--color-cta-text)]"
            : "bg-[#f4ebe4] text-[#6a5d55]";

  return <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${toneClass}`}>{children}</span>;
}

function DueChip({ date }: { date?: string }) {
  const tone = getDueTone(date);
  const className =
    tone === "overdue"
      ? "bg-[#f8e8e4] text-[#9b6f68]"
      : tone === "upcoming"
        ? "bg-[#f5ead7] text-[#8a6c45]"
        : tone === "muted"
          ? "bg-[#f4ebe4] text-[#8c7a72]"
          : "bg-white/70 text-[#6a5d55]";

  return <span className={`rounded-full px-3 py-1 text-xs font-medium ${className}`}>{date ? formatDate(date) : "Not set"}</span>;
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
        <p className="heading-micro mb-5">Private Planning</p>
        <h1 className="heading-primary">Sumaya &amp; Adi</h1>
        <p className="mt-6 text-base leading-8 text-[#6a5d55]">
          A private planning space for vendors, timelines, and upcoming wedding decisions.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-9 w-full rounded-[2rem] border border-[#eaded6] bg-[#fffaf7]/86 p-6 shadow-[0_18px_45px_rgba(90,65,50,0.07)] backdrop-blur md:p-8"
        >
          <TextField label="Passcode" type="password" value={password} onChange={setPassword} placeholder="Enter private passcode" />
          {error && <p className="mt-4 text-left text-sm leading-6 text-[#9b6f68]">{error}</p>}
          <button
            type="submit"
            className="mt-6 w-full rounded-full bg-[var(--color-navy)] px-7 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-cta-text)] shadow-[0_12px_30px_rgba(35,38,58,0.22)] transition duration-300 ease-out hover:-translate-y-[1px] hover:bg-[var(--color-navy-hover)]"
          >
            Enter Dashboard
          </button>
        </form>
      </section>
    </main>
  );
}

type PlanningSummary = {
  nextEvent: string;
  nextPayment: string;
  followUps: number;
  openDecisions: number;
};

function getPlanningSummary(vendors: Vendor[], events: CalendarEvent[], tasks: PlanningTask[]): PlanningSummary {
  const today = todayKey();
  const upcomingEvents = [
    ...events.filter((event) => event.date >= today).map((event) => ({ date: event.date, label: event.title })),
    ...vendors
      .filter((vendor) => vendor.followUpDate && vendor.followUpDate >= today)
      .map((vendor) => ({ date: vendor.followUpDate, label: `Follow up: ${vendor.vendorName}` })),
    ...tasks
      .filter((task) => task.dueDate && task.status !== "Done" && task.dueDate >= today)
      .map((task) => ({ date: task.dueDate, label: task.title })),
  ].sort((first, second) => first.date.localeCompare(second.date));
  const nextPayments = vendors
    .filter((vendor) => parseMoney(vendor.balanceDue) > 0)
    .map((vendor) => ({ vendor, date: getNextVendorDueDate(vendor) }))
    .filter((item) => item.date)
    .sort((first, second) => first.date.localeCompare(second.date));
  const followUps = vendors.filter((vendor) => vendor.followUpDate && vendor.followUpDate <= today).length + tasks.filter((task) => task.status === "Waiting").length;
  const openDecisions =
    vendors.filter((vendor) => ["Researching", "Contacted", "Quote received", "Shortlisted"].includes(vendor.status)).length +
    tasks.filter((task) => task.status !== "Done" && task.priority === "High").length;

  return {
    nextEvent: upcomingEvents[0] ? `${formatDate(upcomingEvents[0].date)} - ${upcomingEvents[0].label}` : "Nothing scheduled",
    nextPayment: nextPayments[0] ? `${formatDate(nextPayments[0].date)} - ${nextPayments[0].vendor.vendorName} ${formatMoney(nextPayments[0].vendor.balanceDue)}` : "No balances due",
    followUps,
    openDecisions,
  };
}

function DashboardSummary({ summary }: { summary: PlanningSummary }) {
  const items = [
    { label: "Next event", value: summary.nextEvent, icon: CalendarDays },
    { label: "Next payment", value: summary.nextPayment, icon: CircleDollarSign },
    { label: "Follow-ups", value: String(summary.followUps), icon: MessageSquareText },
    { label: "Open decisions", value: String(summary.openDecisions), icon: ClipboardList },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-[1rem] border border-[#eaded6] bg-[#fffaf7]/86 px-4 py-3 shadow-[0_10px_24px_rgba(90,65,50,0.04)]">
          <div className="flex items-start gap-3">
            <span className="rounded-full bg-[#f4ebe4] p-2 text-[#b98278]">
              <item.icon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7d6b62]">{item.label}</p>
              <p className="mt-1 text-sm leading-6 text-[#3f302b]">{item.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function OverviewTab({
  vendors,
  events,
  tasks,
  quickNotes,
  setQuickNotes,
  setTasks,
}: {
  vendors: Vendor[];
  events: CalendarEvent[];
  tasks: PlanningTask[];
  quickNotes: string;
  setQuickNotes: (notes: string) => void;
  setTasks: (tasks: PlanningTask[]) => void;
}) {
  const today = todayKey();
  const confirmedVendors = vendors.filter((vendor) => ["Confirmed", "Deposit paid", "Fully paid"].includes(vendor.status));
  const paymentsDue = vendors.filter((vendor) => parseMoney(vendor.balanceDue) > 0);
  const comingUp = [
    ...events.filter((event) => event.date >= today).map((event) => ({ id: event.id, title: event.title, date: event.date, detail: event.type })),
    ...vendors
      .filter((vendor) => vendor.followUpDate && vendor.followUpDate >= today)
      .map((vendor) => ({ id: `follow-${vendor.id}`, title: `Follow up with ${vendor.vendorName}`, date: vendor.followUpDate, detail: vendor.nextAction || "Vendor follow-up" })),
    ...tasks
      .filter((task) => task.dueDate && task.status !== "Done" && task.dueDate >= today)
      .map((task) => ({ id: `task-${task.id}`, title: task.title, date: task.dueDate, detail: `${task.status} - ${task.priority}` })),
  ]
    .sort((first, second) => first.date.localeCompare(second.date))
    .slice(0, 5);
  const summaryCards = [
    { title: "Confirmed Vendors", value: confirmedVendors.length, icon: CheckCircle2 },
    { title: "Payments Due", value: paymentsDue.length, icon: CircleDollarSign },
    { title: "Active Tasks", value: tasks.filter((task) => task.status !== "Done").length, icon: ClipboardList },
    { title: "High Priority", value: tasks.filter((task) => task.status !== "Done" && task.priority === "High").length, icon: FileText },
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
            <h2 className="heading-secondary heading-secondary-compact">Coming Up</h2>
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
              <p className="text-sm leading-7 text-[#6a5d55]">No upcoming items yet. Add events, tasks, or vendor follow-ups.</p>
            )}
          </div>
        </PlanningCard>

        <PlanningCard>
          <div className="flex items-center gap-3">
            <ClipboardList className="h-5 w-5 text-[#b98278]" />
            <h2 className="heading-secondary heading-secondary-compact">Quick Notes</h2>
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

      <TasksPanel vendors={vendors} tasks={tasks} setTasks={setTasks} />
    </div>
  );
}

function TasksPanel({ vendors, tasks, setTasks }: { vendors: Vendor[]; tasks: PlanningTask[]; setTasks: (tasks: PlanningTask[]) => void }) {
  const [form, setForm] = useState<TaskForm>(emptyTaskForm);
  const activeTasks = tasks.filter((task) => task.status !== "Done").sort((first, second) => (first.dueDate || "9999").localeCompare(second.dueDate || "9999"));

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim()) {
      return;
    }

    setTasks([{ ...form, id: createId("planning-task") }, ...tasks]);
    setForm(emptyTaskForm);
  }

  function updateTask(taskId: string, patch: Partial<PlanningTask>) {
    setTasks(tasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task)));
  }

  return (
    <PlanningCard>
      <div className="mb-5">
        <p className="heading-micro">Tasks</p>
        <h2 className="heading-secondary heading-secondary-compact mt-2">Planning Tasks</h2>
      </div>

      <form onSubmit={addTask} className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <TextField label="Task" value={form.title} onChange={(title) => setForm({ ...form, title })} />
        <SelectField label="Vendor" value={form.vendorId} options={["", ...vendors.map((vendor) => vendor.id)]} onChange={(vendorId) => setForm({ ...form, vendorId })} />
        <SelectField label="Category" value={form.category} options={["", ...vendorCategories]} onChange={(category) => setForm({ ...form, category })} />
        <TextField label="Due Date" type="date" value={form.dueDate} onChange={(dueDate) => setForm({ ...form, dueDate })} />
        <SelectField label="Priority" value={form.priority} options={priorities} onChange={(priority) => setForm({ ...form, priority })} />
        <SelectField label="Status" value={form.status} options={taskStatuses} onChange={(status) => setForm({ ...form, status })} />
        <label className="grid gap-2 md:col-span-2 xl:col-span-4">
          <FieldLabel>Notes</FieldLabel>
          <input
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
            className="min-h-11 rounded-2xl border border-[#eaded6] bg-white/80 px-4 text-sm outline-none focus:border-[#b98278]"
          />
        </label>
        <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--color-navy)] px-5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-cta-text)]">
          <Plus className="h-4 w-4" />
          Add Task
        </button>
      </form>

      <div className="mt-6 grid gap-3">
        {activeTasks.length > 0 ? (
          activeTasks.map((task) => (
            <div key={task.id} className="grid gap-3 rounded-2xl bg-white/62 p-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-[#3f302b]">{task.title}</p>
                  <Chip tone={task.priority === "High" ? "rose" : task.priority === "Medium" ? "champagne" : "neutral"}>{task.priority}</Chip>
                  <Chip tone={task.status === "Waiting" ? "champagne" : task.status === "Done" ? "sage" : "neutral"}>{task.status}</Chip>
                </div>
                <p className="mt-2 text-sm text-[#6a5d55]">
                  {task.category || "No category"} {task.dueDate ? `- due ${formatDate(task.dueDate)}` : "- no due date"}
                  {task.vendorId ? ` - ${getVendorName(vendors, task.vendorId)}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {taskStatuses.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => updateTask(task.id, { status })}
                    className={`rounded-full px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                      task.status === status ? "bg-[var(--color-navy)] text-[var(--color-cta-text)]" : "border border-[#eaded6] text-[#6a5d55]"
                    }`}
                  >
                    {status}
                  </button>
                ))}
                <button type="button" onClick={() => setTasks(tasks.filter((item) => item.id !== task.id))} className="rounded-full p-2 text-[#9b6f68] hover:bg-[#f4ebe4]" aria-label={`Delete ${task.title}`}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm leading-7 text-[#6a5d55]">No active tasks yet. Add one when something needs attention.</p>
        )}
      </div>
    </PlanningCard>
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
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("All");
  const [sortBy, setSortBy] = useState<SortOption>("Due date");
  const [query, setQuery] = useState("");
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

  const filteredVendors = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return vendors
      .filter((vendor) => categoryFilter === "All" || vendor.category === categoryFilter)
      .filter((vendor) => statusFilter === "All" || vendor.status === statusFilter)
      .filter((vendor) => paymentFilter === "All" || getPaymentStatus(vendor) === paymentFilter)
      .filter((vendor) =>
        normalizedQuery
          ? [vendor.vendorName, vendor.contact, vendor.email, vendor.phone, vendor.instagram, vendor.website, vendor.notes, vendor.nextAction].some((value) =>
              value.toLowerCase().includes(normalizedQuery),
            )
          : true,
      )
      .sort((first, second) => {
        if (sortBy === "Balance due") {
          return parseMoney(second.balanceDue) - parseMoney(first.balanceDue);
        }

        if (sortBy === "Status") {
          return first.status.localeCompare(second.status);
        }

        if (sortBy === "Vendor name") {
          return first.vendorName.localeCompare(second.vendorName);
        }

        return (getNextVendorDueDate(first) || "9999").localeCompare(getNextVendorDueDate(second) || "9999");
      });
  }, [categoryFilter, paymentFilter, query, sortBy, statusFilter, vendors]);
  const selectedVendor = vendors.find((vendor) => vendor.id === selectedVendorId) ?? null;

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
      setVendors(vendors.map((vendor) => (vendor.id === editingVendorId ? { ...vendor, ...form } : vendor)));
      resetForm();
      return;
    }

    setVendors([{ ...form, id: createId("vendor"), communicationLog: [] }, ...vendors]);
    resetForm();
  }

  function editVendor(vendor: Vendor) {
    setEditingVendorId(vendor.id);
    setForm({
      category: vendor.category,
      vendorName: vendor.vendorName,
      contact: vendor.contact,
      email: vendor.email,
      phone: vendor.phone,
      instagram: vendor.instagram,
      website: vendor.website,
      contactMethod: vendor.contactMethod,
      priority: vendor.priority,
      status: vendor.status,
      contractSigned: vendor.contractSigned,
      quote: vendor.quote,
      depositPaid: vendor.depositPaid,
      balanceDue: vendor.balanceDue,
      dueDate: vendor.dueDate,
      depositDueDate: vendor.depositDueDate,
      finalPaymentDueDate: vendor.finalPaymentDueDate,
      lastContactedDate: vendor.lastContactedDate,
      followUpDate: vendor.followUpDate,
      notes: vendor.notes,
      nextAction: vendor.nextAction,
      filesLinks: vendor.filesLinks,
    });
    setShowForm(true);
  }

  function deleteVendor(vendorId: string) {
    setVendors(vendors.filter((vendor) => vendor.id !== vendorId));
    setEvents(events.map((event) => (event.vendorId === vendorId ? { ...event, vendorId: "" } : event)));
    if (selectedVendorId === vendorId) {
      setSelectedVendorId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8c7a72]" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search vendors, contacts, notes, or next actions..."
            className="min-h-11 w-full rounded-full border border-[#eaded6] bg-[#fffaf7] pl-11 pr-4 text-sm outline-none focus:border-[#b98278]"
          />
        </label>

        <button
          type="button"
          onClick={() => {
            setShowForm(true);
            setEditingVendorId(null);
            setForm(emptyVendorForm);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-navy)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-cta-text)] shadow-[0_12px_30px_rgba(35,38,58,0.2)] transition duration-300 ease-out hover:-translate-y-[1px] hover:bg-[var(--color-navy-hover)]"
        >
          <Plus className="h-4 w-4" />
          Add Vendor
        </button>
      </div>

      <div className="grid gap-3 rounded-[1.25rem] border border-[#eaded6] bg-[#fffaf7]/78 p-4 md:grid-cols-2 xl:grid-cols-4">
        <SelectField label="Category" value={categoryFilter} options={["All", ...vendorCategories]} onChange={setCategoryFilter} />
        <SelectField label="Status" value={statusFilter} options={["All", ...vendorStatuses]} onChange={setStatusFilter} />
        <SelectField label="Payment" value={paymentFilter} options={paymentFilters} onChange={setPaymentFilter} />
        <SelectField label="Sort by" value={sortBy} options={sortOptions} onChange={setSortBy} />
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setStatusFilter("All")} className="rounded-full border border-[#eaded6] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6a5d55]">
          All
        </button>
        {vendorStatuses.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`rounded-full px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] ${
              statusFilter === status ? "bg-[var(--color-navy)] text-[var(--color-cta-text)]" : "border border-[#eaded6] text-[#6a5d55]"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {showForm && (
        <PlanningCard>
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="heading-micro">{editingVendorId ? "Edit Vendor" : "Add Vendor"}</p>
              <h2 className="heading-secondary heading-secondary-compact mt-2">Vendor Details</h2>
            </div>
            <button type="button" onClick={resetForm} aria-label="Close vendor form" className="rounded-full p-2 text-[#7d6b62] hover:bg-[#f4ebe4]">
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SelectField label="Category" value={form.category} options={vendorCategories} onChange={(category) => setForm({ ...form, category })} />
            <TextField label="Vendor Name" value={form.vendorName} onChange={(vendorName) => setForm({ ...form, vendorName })} />
            <TextField label="Main Contact" value={form.contact} onChange={(contact) => setForm({ ...form, contact })} />
            <SelectField label="Contact Method" value={form.contactMethod} options={contactMethods} onChange={(contactMethod) => setForm({ ...form, contactMethod })} />
            <TextField label="Email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
            <TextField label="Phone" value={form.phone} onChange={(phone) => setForm({ ...form, phone })} />
            <TextField label="Instagram" value={form.instagram} onChange={(instagram) => setForm({ ...form, instagram })} />
            <TextField label="Website" value={form.website} onChange={(website) => setForm({ ...form, website })} />
            <SelectField label="Status" value={form.status} options={vendorStatuses} onChange={(status) => setForm({ ...form, status })} />
            <SelectField label="Priority" value={form.priority} options={priorities} onChange={(priority) => setForm({ ...form, priority })} />
            <SelectField label="Contract Signed" value={form.contractSigned} options={["No", "Yes"] as const} onChange={(contractSigned) => setForm({ ...form, contractSigned })} />
            <TextField label="Quote" value={form.quote} onChange={(quote) => setForm({ ...form, quote })} placeholder="$" />
            <TextField label="Deposit Paid" value={form.depositPaid} onChange={(depositPaid) => setForm({ ...form, depositPaid })} placeholder="$" />
            <TextField label="Balance Due" value={form.balanceDue} onChange={(balanceDue) => setForm({ ...form, balanceDue })} placeholder="$" />
            <TextField label="Deposit Due" type="date" value={form.depositDueDate} onChange={(depositDueDate) => setForm({ ...form, depositDueDate })} />
            <TextField label="Final Payment Due" type="date" value={form.finalPaymentDueDate} onChange={(finalPaymentDueDate) => setForm({ ...form, finalPaymentDueDate })} />
            <TextField label="Last Contacted" type="date" value={form.lastContactedDate} onChange={(lastContactedDate) => setForm({ ...form, lastContactedDate })} />
            <TextField label="Follow-up Date" type="date" value={form.followUpDate} onChange={(followUpDate) => setForm({ ...form, followUpDate })} />
            <TextField label="Next Action" value={form.nextAction} onChange={(nextAction) => setForm({ ...form, nextAction })} />
            <TextField label="Files / Links" value={form.filesLinks} onChange={(filesLinks) => setForm({ ...form, filesLinks })} />
            <label className="grid gap-2 md:col-span-2 xl:col-span-4">
              <FieldLabel>Notes</FieldLabel>
              <textarea
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                className="min-h-24 rounded-2xl border border-[#eaded6] bg-white/80 px-4 py-3 text-sm leading-6 outline-none focus:border-[#b98278]"
              />
            </label>
            <div className="flex gap-3 md:col-span-2 xl:col-span-4">
              <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-[var(--color-navy)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-cta-text)] shadow-[0_12px_30px_rgba(35,38,58,0.2)] transition duration-300 ease-out hover:-translate-y-[1px] hover:bg-[var(--color-navy-hover)]">
                <Save className="h-4 w-4" />
                {editingVendorId ? "Update Vendor" : "Save Vendor"}
              </button>
              <button type="button" onClick={resetForm} className="rounded-full border border-[#eaded6] bg-[#fffaf7] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#6a5d55] transition hover:border-[#b98278]">
                Cancel
              </button>
            </div>
          </form>
        </PlanningCard>
      )}

      <div className="hidden overflow-hidden rounded-[1.25rem] border border-[#eaded6] bg-[#fffaf7]/86 shadow-[0_14px_34px_rgba(90,65,50,0.055)] md:block">
        <div className="overflow-x-auto">
          <table className="min-w-[1540px] w-full text-left text-sm">
            <thead className="bg-[#f4ebe4]/72 text-[11px] uppercase tracking-[0.18em] text-[#7d6b62]">
              <tr>
                {[
                  "Vendor",
                  "Category",
                  "Status",
                  "Priority",
                  "Contract",
                  "Quote",
                  "Balance",
                  "Deposit Due",
                  "Final Due",
                  "Last Contact",
                  "Follow-up",
                  "Next Action",
                  "",
                ].map((heading) => (
                  <th key={heading} className="px-4 py-4 font-medium">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaded6]/80">
              {filteredVendors.map((vendor) => (
                <tr key={vendor.id} onClick={() => setSelectedVendorId(vendor.id)} className="cursor-pointer align-top transition hover:bg-white/52">
                  <td className="px-4 py-4">
                    <p className="font-medium text-[#3f302b]">{vendor.vendorName}</p>
                    <p className="mt-1 text-xs text-[#6a5d55]">{vendor.contact || vendor.contactMethod}</p>
                  </td>
                  <td className="px-4 py-4">{vendor.category}</td>
                  <td className="px-4 py-4">
                    <Chip tone={vendor.status === "Fully paid" ? "sage" : vendor.status === "Confirmed" ? "champagne" : "neutral"}>{vendor.status}</Chip>
                  </td>
                  <td className="px-4 py-4">
                    <Chip tone={vendor.priority === "High" ? "rose" : vendor.priority === "Medium" ? "champagne" : "neutral"}>{vendor.priority}</Chip>
                  </td>
                  <td className="px-4 py-4">{vendor.contractSigned}</td>
                  <td className="px-4 py-4">{formatMoney(vendor.quote)}</td>
                  <td className="px-4 py-4">{formatMoney(vendor.balanceDue)}</td>
                  <td className="px-4 py-4">
                    <DueChip date={vendor.depositDueDate} />
                  </td>
                  <td className="px-4 py-4">
                    <DueChip date={vendor.finalPaymentDueDate || vendor.dueDate} />
                  </td>
                  <td className="px-4 py-4">{vendor.lastContactedDate ? formatDate(vendor.lastContactedDate) : "Not set"}</td>
                  <td className="px-4 py-4">
                    <DueChip date={vendor.followUpDate} />
                  </td>
                  <td className="max-w-[260px] px-4 py-4 text-[#6a5d55]">{vendor.nextAction || "Not set"}</td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          editVendor(vendor);
                        }}
                        className="rounded-full p-2 text-[#b98278] hover:bg-[#f4ebe4]"
                        aria-label={`Edit ${vendor.vendorName}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          deleteVendor(vendor.id);
                        }}
                        className="rounded-full p-2 text-[#9b6f68] hover:bg-[#f4ebe4]"
                        aria-label={`Delete ${vendor.vendorName}`}
                      >
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
          <button key={vendor.id} type="button" onClick={() => setSelectedVendorId(vendor.id)} className="text-left">
            <PlanningCard>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[#7d6b62]">{vendor.category}</p>
                  <h3 className="mt-2 font-serif text-2xl text-[#3f302b]">{vendor.vendorName}</h3>
                </div>
                <Chip>{vendor.status}</Chip>
              </div>
              <div className="mt-5 grid gap-3 text-sm text-[#6a5d55]">
                <p>Next: {vendor.nextAction || "Not set"}</p>
                <p>Due: {formatDate(getNextVendorDueDate(vendor))}</p>
                <p>Balance: {formatMoney(vendor.balanceDue)}</p>
              </div>
            </PlanningCard>
          </button>
        ))}
      </div>

      {selectedVendor && (
        <VendorDrawer
          vendor={selectedVendor}
          vendors={vendors}
          setVendors={setVendors}
          events={events}
          onClose={() => setSelectedVendorId(null)}
          onEdit={() => editVendor(selectedVendor)}
        />
      )}
    </div>
  );
}

function VendorDrawer({
  vendor,
  vendors,
  setVendors,
  events,
  onClose,
  onEdit,
}: {
  vendor: Vendor;
  vendors: Vendor[];
  setVendors: (vendors: Vendor[]) => void;
  events: CalendarEvent[];
  onClose: () => void;
  onEdit: () => void;
}) {
  const [logForm, setLogForm] = useState<LogForm>({ ...emptyLogForm, date: todayKey() });
  const linkedEvents = events.filter((event) => event.vendorId === vendor.id);

  function updateVendor(patch: Partial<Vendor>) {
    setVendors(vendors.map((item) => (item.id === vendor.id ? { ...item, ...patch } : item)));
  }

  function addLog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!logForm.summary.trim()) {
      return;
    }

    const nextLog = { ...logForm, id: createId("log") };
    updateVendor({
      communicationLog: [nextLog, ...vendor.communicationLog],
      lastContactedDate: logForm.date,
      followUpDate: logForm.nextFollowUp,
    });
    setLogForm({ ...emptyLogForm, date: todayKey() });
  }

  return (
    <div className="fixed inset-0 z-50 bg-[rgba(28,31,48,0.24)] backdrop-blur-sm">
      <div className="ml-auto flex h-full w-full max-w-2xl flex-col overflow-y-auto border-l border-[#eaded6] bg-[#fbf7f2] p-5 shadow-[-20px_0_60px_rgba(35,38,58,0.18)] sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="heading-micro">{vendor.category}</p>
            <h2 className="heading-secondary mt-2">{vendor.vendorName}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <Chip>{vendor.status}</Chip>
              <Chip tone={vendor.priority === "High" ? "rose" : "champagne"}>{vendor.priority}</Chip>
              <Chip tone={vendor.contractSigned === "Yes" ? "sage" : "neutral"}>Contract {vendor.contractSigned}</Chip>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-[#7d6b62] hover:bg-[#f4ebe4]" aria-label="Close vendor drawer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={onEdit} className="inline-flex items-center gap-2 rounded-full bg-[var(--color-navy)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-cta-text)]">
            <Pencil className="h-4 w-4" />
            Edit Vendor
          </button>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <PlanningCard>
            <h3 className="font-serif text-2xl text-[#3f302b]">Contact</h3>
            <div className="mt-4 space-y-2 text-sm leading-6 text-[#6a5d55]">
              <p>Contact: {vendor.contact || "Not set"}</p>
              <p>Preferred: {vendor.contactMethod}</p>
              <p>Email: {vendor.email || "Not set"}</p>
              <p>Phone: {vendor.phone || "Not set"}</p>
              <p>Instagram: {vendor.instagram || "Not set"}</p>
              <p>Website: {vendor.website || "Not set"}</p>
            </div>
          </PlanningCard>

          <PlanningCard>
            <h3 className="font-serif text-2xl text-[#3f302b]">Payments</h3>
            <div className="mt-4 space-y-2 text-sm leading-6 text-[#6a5d55]">
              <p>Quote: {formatMoney(vendor.quote)}</p>
              <p>Deposit paid: {formatMoney(vendor.depositPaid)}</p>
              <p>Balance due: {formatMoney(vendor.balanceDue)}</p>
              <p>Deposit due: {formatDate(vendor.depositDueDate)}</p>
              <p>Final due: {formatDate(vendor.finalPaymentDueDate || vendor.dueDate)}</p>
            </div>
          </PlanningCard>
        </div>

        <PlanningCard className="mt-4">
          <h3 className="font-serif text-2xl text-[#3f302b]">Notes & Links</h3>
          <div className="mt-4 grid gap-4 text-sm leading-7 text-[#6a5d55]">
            <p>
              <span className="font-medium text-[#3f302b]">Next action:</span> {vendor.nextAction || "Not set"}
            </p>
            <p>
              <span className="font-medium text-[#3f302b]">Files / links:</span> {vendor.filesLinks || "Not set"}
            </p>
            <p>{vendor.notes || "No notes yet."}</p>
          </div>
        </PlanningCard>

        <PlanningCard className="mt-4">
          <h3 className="font-serif text-2xl text-[#3f302b]">Linked Calendar Events</h3>
          <div className="mt-4 space-y-3">
            {linkedEvents.length > 0 ? (
              linkedEvents.map((event) => (
                <div key={event.id} className="rounded-2xl bg-white/62 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-[#3f302b]">{event.title}</p>
                    <Chip>{event.type}</Chip>
                  </div>
                  <p className="mt-2 text-sm text-[#6a5d55]">{formatDate(event.date)}</p>
                </div>
              ))
            ) : (
              <p className="text-sm leading-7 text-[#6a5d55]">No linked events yet.</p>
            )}
          </div>
        </PlanningCard>

        <PlanningCard className="mt-4">
          <h3 className="font-serif text-2xl text-[#3f302b]">Communication Log</h3>
          <form onSubmit={addLog} className="mt-5 grid gap-4 sm:grid-cols-2">
            <TextField label="Date" type="date" value={logForm.date} onChange={(date) => setLogForm({ ...logForm, date })} />
            <SelectField label="Method" value={logForm.method} options={contactMethods} onChange={(method) => setLogForm({ ...logForm, method })} />
            <label className="grid gap-2 sm:col-span-2">
              <FieldLabel>Summary</FieldLabel>
              <input
                value={logForm.summary}
                onChange={(event) => setLogForm({ ...logForm, summary: event.target.value })}
                placeholder="Emailed florist about bouquet quote"
                className="min-h-11 rounded-2xl border border-[#eaded6] bg-white/80 px-4 text-sm outline-none focus:border-[#b98278]"
              />
            </label>
            <TextField label="Next Follow-up" type="date" value={logForm.nextFollowUp} onChange={(nextFollowUp) => setLogForm({ ...logForm, nextFollowUp })} />
            <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--color-navy)] px-5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-cta-text)]">
              <Plus className="h-4 w-4" />
              Add Log
            </button>
          </form>
          <div className="mt-5 space-y-3">
            {vendor.communicationLog.length > 0 ? (
              vendor.communicationLog.map((log) => (
                <div key={log.id} className="rounded-2xl bg-white/62 p-4 text-sm leading-6 text-[#6a5d55]">
                  <p className="font-medium text-[#3f302b]">
                    {formatDate(log.date)} - {log.method}
                  </p>
                  <p className="mt-1">{log.summary}</p>
                  {log.nextFollowUp && <p className="mt-1 text-[#b98278]">Follow up {formatDate(log.nextFollowUp)}</p>}
                </div>
              ))
            ) : (
              <p className="text-sm leading-7 text-[#6a5d55]">No communication logged yet.</p>
            )}
          </div>
        </PlanningCard>
      </div>
    </div>
  );
}

type CalendarItem = CalendarEvent & {
  source: "manual" | "vendor" | "task";
  isGenerated?: boolean;
};

const eventTone: Record<EventType, string> = {
  Meeting: "bg-[#b98278]",
  Payment: "bg-[#8a6c45]",
  "Follow-up": "bg-[#6f7d5b]",
  Deadline: "bg-[#9b6f68]",
  Appointment: "bg-[#7b879d]",
};

function getCalendarItems(vendors: Vendor[], events: CalendarEvent[], tasks: PlanningTask[]): CalendarItem[] {
  const vendorItems: CalendarItem[] = vendors.flatMap((vendor) => {
    const items: CalendarItem[] = [];

    if (vendor.depositDueDate && parseMoney(vendor.balanceDue) > 0) {
      items.push({
        id: `vendor-deposit-${vendor.id}`,
        title: `${vendor.vendorName} deposit due`,
        date: vendor.depositDueDate,
        type: "Payment",
        vendorId: vendor.id,
        notes: `${formatMoney(vendor.balanceDue)} balance tracked for ${vendor.vendorName}.`,
        source: "vendor",
        isGenerated: true,
      });
    }

    if ((vendor.finalPaymentDueDate || vendor.dueDate) && parseMoney(vendor.balanceDue) > 0) {
      items.push({
        id: `vendor-final-${vendor.id}`,
        title: `${vendor.vendorName} final payment`,
        date: vendor.finalPaymentDueDate || vendor.dueDate,
        type: "Payment",
        vendorId: vendor.id,
        notes: `${formatMoney(vendor.balanceDue)} remaining.`,
        source: "vendor",
        isGenerated: true,
      });
    }

    if (vendor.followUpDate) {
      items.push({
        id: `vendor-follow-${vendor.id}`,
        title: `Follow up with ${vendor.vendorName}`,
        date: vendor.followUpDate,
        type: "Follow-up",
        vendorId: vendor.id,
        notes: vendor.nextAction,
        source: "vendor",
        isGenerated: true,
      });
    }

    return items;
  });
  const taskItems: CalendarItem[] = tasks
    .filter((task) => task.dueDate && task.status !== "Done")
    .map((task) => ({
      id: `task-${task.id}`,
      title: task.title,
      date: task.dueDate,
      type: "Deadline",
      vendorId: task.vendorId,
      notes: `${task.status} - ${task.priority}${task.notes ? ` - ${task.notes}` : ""}`,
      source: "task",
      isGenerated: true,
    }));

  return [...events.map((event) => ({ ...event, source: "manual" as const })), ...vendorItems, ...taskItems];
}

function CalendarTab({
  vendors,
  events,
  tasks,
  setEvents,
}: {
  vendors: Vendor[];
  events: CalendarEvent[];
  tasks: PlanningTask[];
  setEvents: (events: CalendarEvent[]) => void;
}) {
  const [viewDate, setViewDate] = useState(() => new Date(2026, 4, 1));
  const [selectedDate, setSelectedDate] = useState("2026-05-20");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
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
  const allEvents = getCalendarItems(vendors, events, tasks);
  const selectedEvents = allEvents.filter((event) => event.date === selectedDate);
  const selectedEvent = allEvents.find((event) => event.id === selectedEventId) ?? selectedEvents[0] ?? null;

  function changeMonth(offset: number) {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  }

  function addEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!eventForm.title.trim() || !eventForm.date) {
      return;
    }

    const nextEvent = { ...eventForm, id: createId("event") };
    setEvents([nextEvent, ...events]);
    setSelectedDate(eventForm.date);
    setSelectedEventId(nextEvent.id);
    setEventForm({ ...emptyEventForm, date: eventForm.date });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
      <PlanningCard>
        <div className="mb-5 flex items-center justify-between gap-4">
          <button type="button" onClick={() => changeMonth(-1)} aria-label="Previous month" className="rounded-full border border-[#eaded6] bg-white/60 p-2 text-[#6a5d55] hover:border-[#b98278]">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="heading-secondary heading-secondary-compact text-center">
            {new Intl.DateTimeFormat("en-AU", { month: "long", year: "numeric" }).format(monthStart)}
          </h2>
          <button type="button" onClick={() => changeMonth(1)} aria-label="Next month" className="rounded-full border border-[#eaded6] bg-white/60 p-2 text-[#6a5d55] hover:border-[#b98278]">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {eventTypes.map((type) => (
            <span key={type} className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6a5d55]">
              <span className={`h-2 w-2 rounded-full ${eventTone[type]}`} />
              {type}
            </span>
          ))}
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
                onClick={() => {
                  setSelectedDate(cell.date);
                  setSelectedEventId(dayEvents[0]?.id ?? null);
                }}
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
                    {dayEvents.slice(0, 4).map((event) => (
                      <span key={event.id} className={`h-1.5 w-1.5 rounded-full ${eventTone[event.type]}`} />
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
          <p className="heading-micro">Selected Date</p>
          <h2 className="heading-secondary heading-secondary-compact mt-2">{formatDate(selectedDate)}</h2>
          <div className="mt-5 space-y-3">
            {selectedEvents.length > 0 ? (
              selectedEvents.map((event) => (
                <button key={event.id} type="button" onClick={() => setSelectedEventId(event.id)} className="w-full text-left">
                  <div className={`rounded-2xl p-4 ${selectedEventId === event.id ? "bg-[#f4ebe4]" : "bg-white/62"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-[#3f302b]">{event.title}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[#b98278]">{event.type}</p>
                      </div>
                      {!event.isGenerated && (
                        <button
                          type="button"
                          onClick={(clickEvent) => {
                            clickEvent.stopPropagation();
                            setEvents(events.filter((item) => item.id !== event.id));
                          }}
                          aria-label={`Delete ${event.title}`}
                          className="rounded-full p-1.5 text-[#9b6f68] hover:bg-[#f4ebe4]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <p className="text-sm leading-7 text-[#6a5d55]">No events on this date yet.</p>
            )}
          </div>
        </PlanningCard>

        {selectedEvent && (
          <PlanningCard>
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#7d6b62]">Event Details</p>
            <h3 className="mt-2 font-serif text-2xl text-[#3f302b]">{selectedEvent.title}</h3>
            <div className="mt-4 space-y-2 text-sm leading-6 text-[#6a5d55]">
              <p>Type: {selectedEvent.type}</p>
              <p>Date: {formatDate(selectedEvent.date)}</p>
              {selectedEvent.vendorId && <p>Vendor: {getVendorName(vendors, selectedEvent.vendorId) || "Linked vendor"}</p>}
              {selectedEvent.notes && <p>{selectedEvent.notes}</p>}
            </div>
          </PlanningCard>
        )}

        <PlanningCard>
          <h2 className="heading-secondary heading-secondary-compact">Add Event</h2>
          <form onSubmit={addEvent} className="mt-5 grid gap-4">
            <TextField label="Title" value={eventForm.title} onChange={(title) => setEventForm({ ...eventForm, title })} />
            <TextField label="Date" type="date" value={eventForm.date} onChange={(date) => setEventForm({ ...eventForm, date })} />
            <SelectField label="Type" value={eventForm.type} options={eventTypes} onChange={(type) => setEventForm({ ...eventForm, type })} />
            <SelectField label="Linked Vendor" value={eventForm.vendorId} options={["", ...vendors.map((vendor) => vendor.id)]} onChange={(vendorId) => setEventForm({ ...eventForm, vendorId })} />
            <label className="grid gap-2">
              <FieldLabel>Notes</FieldLabel>
              <textarea
                value={eventForm.notes}
                onChange={(event) => setEventForm({ ...eventForm, notes: event.target.value })}
                className="min-h-24 rounded-2xl border border-[#eaded6] bg-white/80 px-4 py-3 text-sm leading-6 outline-none focus:border-[#b98278]"
              />
            </label>
            <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-navy)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-cta-text)] shadow-[0_12px_30px_rgba(35,38,58,0.2)] transition duration-300 ease-out hover:-translate-y-[1px] hover:bg-[var(--color-navy-hover)]">
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
              tasks: [...section.tasks, { id: createId("timeline-task"), text, done: false }],
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
              <h2 className="heading-secondary heading-secondary-compact">{section.title}</h2>
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

function NotesTab({ notes, setNotes }: { notes: PlanningNotes; setNotes: (notes: PlanningNotes) => void }) {
  const noteSections: Array<{ key: keyof PlanningNotes; title: string; placeholder: string }> = [
    { key: "decision", title: "Decision Notes", placeholder: "Vendor comparisons, decisions, negotiations..." },
    { key: "budget", title: "Budget Notes", placeholder: "Deposits, balances, what is included..." },
    { key: "design", title: "Design / Styling Ideas", placeholder: "Palette, florals, stationery, table styling..." },
    { key: "venueQuestions", title: "Questions for Venue", placeholder: "Logistics, timings, wet weather, inclusions..." },
    { key: "vendorQuestions", title: "Questions for Vendors", placeholder: "Things to ask during calls or follow-ups..." },
  ];

  return (
    <div className="grid gap-5">
      {noteSections.map((section) => (
        <PlanningCard key={section.key}>
          <div className="max-w-3xl">
            <p className="heading-micro">Notes</p>
            <h2 className="heading-secondary heading-secondary-compact mt-2">{section.title}</h2>
          </div>
          <textarea
            value={notes[section.key]}
            onChange={(event) => setNotes({ ...notes, [section.key]: event.target.value })}
            placeholder={section.placeholder}
            className="mt-5 min-h-[220px] w-full resize-y rounded-[1.25rem] border border-[#eaded6] bg-white/72 p-5 text-sm leading-7 text-[#3f302b] outline-none transition duration-300 ease-out placeholder:text-[#a99790] focus:border-[#b98278]"
          />
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-[#8c7a72]">Auto-saved locally</p>
        </PlanningCard>
      ))}
    </div>
  );
}

type PlanningExport = {
  version: 1;
  exportedAt: string;
  vendors: Vendor[];
  events: CalendarEvent[];
  tasks: PlanningTask[];
  timeline: TimelineSection[];
  quickNotes: string;
  notes: PlanningNotes;
};

function PlanningDashboardContent() {
  const shouldReduceMotion = useReducedMotion();
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [storedVendors, setStoredVendors] = useLocalStorageState<Vendor[]>(VENDORS_KEY, defaultVendors);
  const [storedEvents, setStoredEvents] = useLocalStorageState<CalendarEvent[]>(EVENTS_KEY, defaultCalendarEvents);
  const [storedTasks, setStoredTasks] = useLocalStorageState<PlanningTask[]>(TASKS_KEY, defaultTasks);
  const [storedTimeline, setStoredTimeline] = useLocalStorageState<TimelineSection[]>(TIMELINE_KEY, defaultTimeline);
  const [quickNotes, setQuickNotes] = useLocalStorageState(QUICK_NOTES_KEY, "");
  const [legacyDecisionNotes] = useLocalStorageState(LEGACY_DECISION_NOTES_KEY, "");
  const [storedNotes, setStoredNotes] = useLocalStorageState<PlanningNotes>(NOTES_KEY, defaultNotes);
  const vendors = useMemo(() => normalizeVendors(storedVendors), [storedVendors]);
  const events = useMemo(() => normalizeEvents(storedEvents), [storedEvents]);
  const tasks = useMemo(() => normalizeTasks(storedTasks), [storedTasks]);
  const timeline = useMemo(() => normalizeTimeline(storedTimeline), [storedTimeline]);
  const notes = useMemo(() => normalizeNotes(storedNotes, legacyDecisionNotes), [legacyDecisionNotes, storedNotes]);
  const planningSummary = useMemo(() => getPlanningSummary(vendors, events, tasks), [events, tasks, vendors]);
  const setVendors = useCallback((next: Vendor[]) => setStoredVendors(normalizeVendors(next)), [setStoredVendors]);
  const setEvents = useCallback((next: CalendarEvent[]) => setStoredEvents(normalizeEvents(next)), [setStoredEvents]);
  const setTasks = useCallback((next: PlanningTask[]) => setStoredTasks(normalizeTasks(next)), [setStoredTasks]);
  const setTimeline = useCallback((next: TimelineSection[]) => setStoredTimeline(normalizeTimeline(next)), [setStoredTimeline]);
  const setNotes = useCallback((next: PlanningNotes) => setStoredNotes(normalizeNotes(next)), [setStoredNotes]);
  const reveal = {
    initial: shouldReduceMotion ? false : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: shouldReduceMotion ? 0 : 0.55, ease: revealEase },
  };

  function exportPlanningData() {
    const payload: PlanningExport = {
      version: 1,
      exportedAt: new Date().toISOString(),
      vendors,
      events,
      tasks,
      timeline,
      quickNotes,
      notes,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sumaya-adi-planning-${todayKey()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function importPlanningData(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const payload = JSON.parse(await file.text()) as Partial<PlanningExport>;
      setVendors(normalizeVendors(payload.vendors));
      setEvents(normalizeEvents(payload.events));
      setTasks(normalizeTasks(payload.tasks));
      setTimeline(normalizeTimeline(payload.timeline));
      setQuickNotes(typeof payload.quickNotes === "string" ? payload.quickNotes : "");
      setNotes(normalizeNotes(payload.notes));
    } catch {
      window.alert("That JSON file could not be imported.");
    } finally {
      event.target.value = "";
    }
  }

  const renderTab = useCallback(() => {
    if (activeTab === "Overview") {
      return <OverviewTab vendors={vendors} events={events} tasks={tasks} quickNotes={quickNotes} setQuickNotes={setQuickNotes} setTasks={setTasks} />;
    }

    if (activeTab === "Vendors") {
      return <VendorsTab vendors={vendors} setVendors={setVendors} events={events} setEvents={setEvents} />;
    }

    if (activeTab === "Calendar") {
      return <CalendarTab vendors={vendors} events={events} tasks={tasks} setEvents={setEvents} />;
    }

    if (activeTab === "Timeline") {
      return <TimelineTab timeline={timeline} setTimeline={setTimeline} />;
    }

    return <NotesTab notes={notes} setNotes={setNotes} />;
  }, [activeTab, events, notes, quickNotes, setEvents, setNotes, setQuickNotes, setTasks, setTimeline, setVendors, tasks, timeline, vendors]);

  return (
    <main className="min-h-screen bg-[#fbf7f2] px-5 py-8 text-[#4f4641] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <motion.header {...reveal} className="relative overflow-hidden rounded-[2rem] border border-[#eaded6] bg-[#fffaf7]/82 px-6 py-10 shadow-[0_18px_45px_rgba(90,65,50,0.06)] md:px-10 md:py-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(232,174,168,0.14),transparent_32%),radial-gradient(circle_at_86%_70%,rgba(232,215,189,0.20),transparent_34%)]" />
          <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="heading-micro mb-4">Private Planning</p>
              <h1 className="heading-primary">Sumaya &amp; Adi</h1>
              <p className="mt-5 max-w-2xl text-[16px] leading-8 text-[#6a5d55]">
                A private space for managing vendors, timelines, and upcoming plans.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={exportPlanningData} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#eaded6] bg-white/68 px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#3f302b] transition hover:border-[#b98278]">
                <Download className="h-4 w-4" />
                Export JSON
              </button>
              <button type="button" onClick={() => importInputRef.current?.click()} className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-navy)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-cta-text)] shadow-[0_12px_30px_rgba(35,38,58,0.18)] transition hover:bg-[var(--color-navy-hover)]">
                <Upload className="h-4 w-4" />
                Import JSON
              </button>
              <input ref={importInputRef} type="file" accept="application/json" onChange={importPlanningData} className="hidden" />
            </div>
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
                  activeTab === tab ? "bg-[var(--color-navy)] text-[var(--color-cta-text)] shadow-[0_10px_24px_rgba(35,38,58,0.18)]" : "text-[#6a5d55] hover:bg-[#f4ebe4] hover:text-[#3f302b]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <DashboardSummary summary={planningSummary} />
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
