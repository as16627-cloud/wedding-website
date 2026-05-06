"use client";

import { upload } from "@vercel/blob/client";
import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Download,
  FileDown,
  FileText,
  FileUp,
  MessageSquareText,
  Paperclip,
  Pencil,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  formatPrivatePlanningFileSize,
  getPrivatePlanningFileExtension,
  getPrivatePlanningMimeForExtension,
  PRIVATE_PLANNING_MAX_FILE_BYTES,
  privatePlanningAllowedMimeTypes,
} from "@/lib/private-planning-file-rules";
import PrivatePlanningGuestsTab from "./private-planning-guests-tab";

const VENDORS_KEY = "private-planning-vendors";
const EVENTS_KEY = "private-planning-calendar-events";
const TASKS_KEY = "private-planning-tasks";
const TIMELINE_KEY = "private-planning-timeline";
const QUICK_NOTES_KEY = "private-planning-quick-notes";
const NOTES_KEY = "private-planning-notes";
const LEGACY_DECISION_NOTES_KEY = "private-planning-decision-notes";
const PRIVATE_PLANNING_DATA_ENDPOINT = "/api/private-planning/data";
const PRIVATE_PLANNING_CSRF_HEADER = "x-private-planning-csrf";
const LEGACY_PLANNING_STORAGE_KEYS = [
  VENDORS_KEY,
  EVENTS_KEY,
  TASKS_KEY,
  TIMELINE_KEY,
  QUICK_NOTES_KEY,
  NOTES_KEY,
  LEGACY_DECISION_NOTES_KEY,
];

const revealEase = [0.22, 1, 0.36, 1] as const;
const tabs = ["Overview", "Vendors", "Calendar", "Timeline", "Runsheet", "Guests", "Files", "Notes"] as const;
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
const runsheetStatuses = ["Draft", "Confirmed", "Needs confirmation", "Optional", "Optional / Needs confirmation"] as const;
const runsheetGroupNames = [
  "Morning Prep",
  "Ceremony",
  "Cocktail Hour / Portraits",
  "Reception",
  "Party / Farewell",
] as const;
const paymentFilters = ["All", "Paid", "Balance due", "Overdue", "Due in 14 days"] as const;
const sortOptions = ["Due date", "Balance due", "Status", "Vendor name"] as const;

type Tab = (typeof tabs)[number];
type VendorCategory = (typeof vendorCategories)[number];
type VendorStatus = (typeof vendorStatuses)[number];
type Priority = (typeof priorities)[number];
type ContactMethod = (typeof contactMethods)[number];
type EventType = (typeof eventTypes)[number];
type TaskStatus = (typeof taskStatuses)[number];
type RunsheetStatus = (typeof runsheetStatuses)[number];
type RunsheetGroupName = (typeof runsheetGroupNames)[number];
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
  category: string;
  priority: Priority;
  tasks: TimelineTask[];
};

type RunsheetItem = {
  id: string;
  time: string;
  title: string;
  category: string;
  location: string;
  owner: string;
  notes: string;
  vendorId: string;
  status: RunsheetStatus;
  internalOnly: boolean;
  buffer: boolean;
};

type RunsheetRole = {
  id: string;
  role: string;
  person: string;
  responsibility: string;
};

type RunsheetChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

type RunsheetNotes = {
  wetWeatherPlan: string;
  vendorContacts: string;
  familyPhotoList: string;
  speechOrder: string;
  songList: string;
  decorStylingSetup: string;
  ceremonySetup: string;
  receptionSetup: string;
  dietaryAllergyNotes: string;
  transportNotes: string;
  packDownNotes: string;
  itemsToBring: string;
  itemsToCollect: string;
};

type Runsheet = {
  items: RunsheetItem[];
  alternateEnding: {
    title: string;
    notes: string[];
    items: RunsheetItem[];
  };
  roles: RunsheetRole[];
  confirmationChecklist: RunsheetChecklistItem[];
  notes: RunsheetNotes;
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
type RunsheetItemForm = Omit<RunsheetItem, "id">;

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

const emptyRunsheetNotes: RunsheetNotes = {
  wetWeatherPlan: "",
  vendorContacts: "",
  familyPhotoList: "",
  speechOrder: "",
  songList: "",
  decorStylingSetup: "",
  ceremonySetup: "",
  receptionSetup: "",
  dietaryAllergyNotes: "",
  transportNotes: "",
  packDownNotes: "",
  itemsToBring: "",
  itemsToCollect: "",
};

const emptyRunsheet: Runsheet = {
  items: [],
  alternateEnding: {
    title: "Alternate ending if venue allows midnight finish",
    notes: [],
    items: [],
  },
  roles: [],
  confirmationChecklist: [],
  notes: emptyRunsheetNotes,
};

const emptyRunsheetItemForm: RunsheetItemForm = {
  time: "",
  title: "",
  category: "Morning Prep",
  location: "",
  owner: "",
  notes: "",
  vendorId: "",
  status: "Draft",
  internalOnly: false,
  buffer: false,
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

function createTimelineTasks(sectionId: string, tasks: string[]): TimelineTask[] {
  return tasks.map((text, index) => ({
    id: `${sectionId}-task-${String(index + 1).padStart(2, "0")}`,
    text,
    done: false,
  }));
}

const defaultTimeline: TimelineSection[] = [
  {
    id: "timeline-2026-04-01-planning-reset",
    title: "1-7 April 2026 - Planning reset + essentials audit",
    category: "Planning",
    priority: "High",
    tasks: createTimelineTasks("timeline-2026-04-01-planning-reset", [
      "Confirm overall wedding vibe and design direction.",
      "Confirm working budget and payment tracking.",
      "Create or review full guest list.",
      "Decide whether a planner/coordinator is needed.",
      "Audit what is already booked: venue, photographer, videographer, florist, celebrant, entertainment, dress, accommodation.",
      "Create urgent supplier shortlist for anything not yet booked.",
    ]),
  },
  {
    id: "timeline-2026-04-08-guest-list-save-date",
    title: "8-14 April 2026 - Guest list + save-the-date foundation",
    category: "Guests",
    priority: "High",
    tasks: createTimelineTasks("timeline-2026-04-08-guest-list-save-date", [
      "Finalize working guest list.",
      "Group guests into households.",
      "Confirm addresses/emails if needed.",
      "Confirm RSVP process and guest-facing RSVP page.",
      "Send or prepare save-the-dates if not already done.",
      "Research accommodation options for guests if required.",
    ]),
  },
  {
    id: "timeline-2026-04-15-core-supplier-booking",
    title: "15-21 April 2026 - Core supplier booking sprint",
    category: "Vendors",
    priority: "High",
    tasks: createTimelineTasks("timeline-2026-04-15-core-supplier-booking", [
      "Book or confirm photographer.",
      "Book or confirm videographer.",
      "Book or confirm celebrant/officiant.",
      "Book or confirm entertainment for ceremony, cocktail hour, reception, and dance floor.",
      "Contact decor/hire companies for chairs, lighting, marquee, styling, signage, or ceremony/reception setup.",
    ]),
  },
  {
    id: "timeline-2026-04-22-attire-beauty-honeymoon",
    title: "22-30 April 2026 - Attire, beauty, honeymoon + admin",
    category: "Attire / Travel / Admin",
    priority: "High",
    tasks: createTimelineTasks("timeline-2026-04-22-attire-beauty-honeymoon", [
      "Start or confirm wedding dress order.",
      "Book hair and makeup artists.",
      "Check passports for honeymoon travel.",
      "Research or book honeymoon.",
      "Confirm bridal party and proposal gifts if still needed.",
      "Start hen and bucks party planning with bridal party.",
    ]),
  },
  {
    id: "timeline-2026-05-01-invitation-rsvp-plan",
    title: "1-10 May 2026 - Invitation and RSVP plan",
    category: "Guests",
    priority: "High",
    tasks: createTimelineTasks("timeline-2026-05-01-invitation-rsvp-plan", [
      "Confirm invitation wording and design.",
      "Set RSVP deadline.",
      "Prepare guest RSVP instructions.",
      "Confirm whether guests need accommodation/travel notes.",
      "Prepare invitation send list.",
    ]),
  },
  {
    id: "timeline-2026-05-11-floral-styling-flow",
    title: "11-24 May 2026 - Floral, styling + event flow",
    category: "Styling / Vendors",
    priority: "High",
    tasks: createTimelineTasks("timeline-2026-05-11-floral-styling-flow", [
      "Review floral direction.",
      "Confirm ceremony floral needs.",
      "Confirm reception floral needs.",
      "Confirm styling/decor requirements.",
      "Confirm ceremony-to-reception flow.",
      "Review entertainment timing for ceremony, cocktail hour, dinner, and dance floor.",
    ]),
  },
  {
    id: "timeline-2026-05-25-rings-cake-transport",
    title: "25-31 May 2026 - Rings, cake, transport decisions",
    category: "Details",
    priority: "Medium",
    tasks: createTimelineTasks("timeline-2026-05-25-rings-cake-transport", [
      "Choose and order wedding rings.",
      "Research and book/order wedding cake.",
      "Organize wedding transport if required.",
      "Choose bridesmaid dresses if required.",
      "Confirm hair and makeup trial timing.",
    ]),
  },
  {
    id: "timeline-2026-06-01-send-invitations",
    title: "1-7 June 2026 - Send invitations",
    category: "Guests",
    priority: "High",
    tasks: createTimelineTasks("timeline-2026-06-01-send-invitations", [
      "Send wedding invitations.",
      "Confirm RSVP page is working.",
      "Confirm RSVP deadline is visible.",
      "Track sent invitations in the guest list.",
      "Suggested RSVP deadline: 1 September 2026.",
    ]),
  },
  {
    id: "timeline-2026-06-08-beauty-dresses-confirmations",
    title: "8-21 June 2026 - Beauty, dresses + supplier confirmations",
    category: "Attire / Vendors",
    priority: "Medium",
    tasks: createTimelineTasks("timeline-2026-06-08-beauty-dresses-confirmations", [
      "Book or attend hair and makeup trial.",
      "Confirm bridesmaid dresses.",
      "Confirm transport booking.",
      "Confirm cake booking.",
      "Review supplier contracts and payment due dates.",
      "Upload invoices/receipts into Private Planning Files.",
    ]),
  },
  {
    id: "timeline-2026-06-22-hire-decor-lock-in",
    title: "22-30 June 2026 - Hire/decor lock-in",
    category: "Styling",
    priority: "Medium",
    tasks: createTimelineTasks("timeline-2026-06-22-hire-decor-lock-in", [
      "Confirm all decor and hire items.",
      "Confirm ceremony setup needs.",
      "Confirm reception setup needs.",
      "Confirm lighting/styling/marquee requirements if applicable.",
      "Update vendor notes with all confirmed inclusions.",
    ]),
  },
  {
    id: "timeline-2026-07-01-outfits-accessories-gifts",
    title: "1-14 July 2026 - Outfits, accessories + gifts",
    category: "Attire",
    priority: "Medium",
    tasks: createTimelineTasks("timeline-2026-07-01-outfits-accessories-gifts", [
      "Buy wedding shoes.",
      "Buy jewellery and accessories.",
      "Shop for groom and groomsmen suits.",
      "Organize gifts for bridesmaids, groomsmen, parents, and key family members.",
    ]),
  },
  {
    id: "timeline-2026-07-15-small-details",
    title: "15-31 July 2026 - Small details purchase list",
    category: "Details",
    priority: "Medium",
    tasks: createTimelineTasks("timeline-2026-07-15-small-details", [
      "Purchase confetti.",
      "Confirm ring box.",
      "Confirm guest book.",
      "Confirm vow cards/books.",
      "Confirm wedding day cards.",
      "Confirm sparklers if using.",
      "Confirm cake knife.",
      "Confirm getting-ready outfits.",
      "Start detail box for photographer.",
    ]),
  },
  {
    id: "timeline-2026-08-01-seating-chart-prep",
    title: "1-9 August 2026 - Seating chart preparation",
    category: "Guests",
    priority: "Medium",
    tasks: createTimelineTasks("timeline-2026-08-01-seating-chart-prep", [
      "Start working on seating chart.",
      "Group guests by household/family/friend group.",
      "Flag dietary requirements and accessibility notes.",
      "Identify guests who may need RSVP follow-up.",
    ]),
  },
  {
    id: "timeline-2026-08-10-first-dress-fitting",
    title: "10-16 August 2026 - First dress fitting",
    category: "Attire",
    priority: "High",
    tasks: createTimelineTasks("timeline-2026-08-10-first-dress-fitting", [
      "Attend first dress fitting.",
      "Confirm alteration timeline.",
      "Confirm veil/accessory pairing.",
      "Check shoes with dress length if available.",
    ]),
  },
  {
    id: "timeline-2026-08-17-music-selections",
    title: "17-23 August 2026 - Music selections",
    category: "Ceremony / Reception",
    priority: "Medium",
    tasks: createTimelineTasks("timeline-2026-08-17-music-selections", [
      "Choose walking down the aisle song.",
      "Choose signing register song.",
      "Choose confetti exit song.",
      "Choose reception entrance song.",
      "Choose first dance song.",
      "Choose parent/family dance songs if needed.",
      "Share draft song list with entertainment/DJ.",
    ]),
  },
  {
    id: "timeline-2026-08-24-details-checkpoint",
    title: "24-31 August 2026 - Details checkpoint",
    category: "Details",
    priority: "Medium",
    tasks: createTimelineTasks("timeline-2026-08-24-details-checkpoint", [
      "Check all small wedding-day items are purchased or ordered.",
      "Confirm detail box items.",
      "Review vendor invoices and upcoming payment deadlines.",
      "Review timeline gaps before RSVP deadline.",
    ]),
  },
  {
    id: "timeline-2026-09-01-rsvp-deadline",
    title: "1 September 2026 - RSVP deadline",
    category: "Guests",
    priority: "High",
    tasks: createTimelineTasks("timeline-2026-09-01-rsvp-deadline", [
      "Close or review RSVPs.",
      "Identify missing RSVPs.",
      "Update confirmed guest list.",
      "Update meal choices and dietary notes.",
    ]),
  },
  {
    id: "timeline-2026-09-02-rsvp-follow-up",
    title: "2-7 September 2026 - RSVP follow-up",
    category: "Guests",
    priority: "High",
    tasks: createTimelineTasks("timeline-2026-09-02-rsvp-follow-up", [
      "Follow up with guests who have not RSVP'd.",
      "Confirm final attendance numbers.",
      "Confirm plus-ones.",
      "Confirm children/household details if applicable.",
    ]),
  },
  {
    id: "timeline-2026-09-08-seating-chart-draft",
    title: "8-14 September 2026 - Seating chart draft",
    category: "Guests",
    priority: "High",
    tasks: createTimelineTasks("timeline-2026-09-08-seating-chart-draft", [
      "Create first full seating chart.",
      "Confirm table groupings.",
      "Confirm dietary/allergy notes.",
      "Flag guests needing accessibility consideration.",
    ]),
  },
  {
    id: "timeline-2026-09-15-supplier-schedule",
    title: "15-21 September 2026 - Supplier schedule draft",
    category: "Vendors",
    priority: "High",
    tasks: createTimelineTasks("timeline-2026-09-15-supplier-schedule", [
      "Draft wedding-day run sheet.",
      "Confirm supplier arrival times.",
      "Confirm ceremony timing.",
      "Confirm reception timing.",
      "Confirm photography timeline.",
      "Confirm hair and makeup timing.",
    ]),
  },
  {
    id: "timeline-2026-09-22-vows-payments",
    title: "22-30 September 2026 - Vows + final payment tracker",
    category: "Ceremony / Finance",
    priority: "High",
    tasks: createTimelineTasks("timeline-2026-09-22-vows-payments", [
      "Start writing vows.",
      "Review all vendor balances.",
      "Confirm final payment due dates.",
      "Upload any outstanding invoices or receipts.",
      "Prepare final supplier questions.",
    ]),
  },
  {
    id: "timeline-2026-10-01-final-payments",
    title: "1-7 October 2026 - Final payments + supplier confirmations",
    category: "Finance / Vendors",
    priority: "High",
    tasks: createTimelineTasks("timeline-2026-10-01-final-payments", [
      "Pay final supplier balances due around 4 weeks before the wedding.",
      "Confirm schedule and timings with all suppliers.",
      "Confirm final venue/catering requirements.",
      "Confirm final guest numbers if due.",
    ]),
  },
  {
    id: "timeline-2026-10-08-final-details",
    title: "8-17 October 2026 - Final details lock-in",
    category: "Details",
    priority: "High",
    tasks: createTimelineTasks("timeline-2026-10-08-final-details", [
      "Finalize seating chart.",
      "Finalize place cards or escort cards.",
      "Break in wedding shoes.",
      "Finalize vows.",
      "Finalize ceremony details.",
      "Finalize reception details.",
      "Prepare wedding day emergency kit.",
    ]),
  },
  {
    id: "timeline-2026-10-18-two-week-countdown",
    title: "18-24 October 2026 - Two-week countdown",
    category: "Final Prep",
    priority: "High",
    tasks: createTimelineTasks("timeline-2026-10-18-two-week-countdown", [
      "Attend final dress fitting.",
      "Get hair cut and coloured.",
      "Confirm beauty appointments.",
      "Confirm rehearsal timing if applicable.",
      "Confirm packed items list.",
      "Confirm photographer detail box.",
    ]),
  },
  {
    id: "timeline-2026-10-25-wedding-week",
    title: "25-30 October 2026 - Wedding week",
    category: "Wedding Week",
    priority: "High",
    tasks: createTimelineTasks("timeline-2026-10-25-wedding-week", [
      "Manicure and pedicure.",
      "Clean rings.",
      "Spray tan if planned.",
      "Practice vows out loud.",
      "Write cards for partner, parents, bridal party, or family.",
      "Prepare emergency kit.",
      "Prepare getting-ready playlist.",
      "Attend ceremony rehearsal if applicable.",
      "Pack bags.",
    ]),
  },
  {
    id: "timeline-2026-10-31-wedding-eve",
    title: "31 October 2026 - Day before",
    category: "Wedding Eve",
    priority: "High",
    tasks: createTimelineTasks("timeline-2026-10-31-wedding-eve", [
      "Steam wedding dress, veil, bridesmaid dresses, and wedding morning outfits.",
      "Pack clutch or small personal bag.",
      "Prepare confetti in cone tray if using.",
      "Store confetti in a cool, dry place.",
      "Lay out wedding-day items for the morning.",
      "Get a good night's sleep.",
    ]),
  },
  {
    id: "timeline-2026-11-01-wedding-morning",
    title: "1 November 2026 - Wedding morning",
    category: "Wedding Day",
    priority: "High",
    tasks: createTimelineTasks("timeline-2026-11-01-wedding-morning", [
      "Lay out rings, invitations, vow cards, shoes, jewellery, sentimental items, and detail box for photographer.",
      "Stay hydrated.",
      "Eat properly.",
      "Enjoy the day.",
    ]),
  },
];

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getLocalRawValue(key: string) {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(key);
}

function parseStoredValue<T>(key: string, fallback: T) {
  const rawValue = getLocalRawValue(key);

  if (!rawValue) {
    return fallback;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
}

function clearLegacyPlanningStorage() {
  if (typeof window === "undefined") {
    return;
  }

  for (const key of LEGACY_PLANNING_STORAGE_KEYS) {
    localStorage.removeItem(key);
  }
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

function normalizeTimelineKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeTimelineTask(raw: Partial<TimelineTask> & Record<string, unknown>): TimelineTask {
  return {
    id: typeof raw.id === "string" ? raw.id : createId("timeline-task"),
    text: typeof raw.text === "string" ? raw.text : "",
    done: Boolean(raw.done),
  };
}

function normalizeTimeline(value: unknown): TimelineSection[] {
  if (!Array.isArray(value)) {
    return defaultTimeline;
  }

  const savedSections = value.filter(
    (section): section is Partial<TimelineSection> & Record<string, unknown> => typeof section === "object" && section !== null,
  );
  const byId = new Map(savedSections.map((section) => [typeof section.id === "string" ? section.id : "", section]));
  const byTitle = new Map(
    savedSections
      .filter((section) => typeof section.title === "string")
      .map((section) => [normalizeTimelineKey(String(section.title)), section]),
  );
  const defaultIds = new Set(defaultTimeline.map((section) => section.id));
  const defaultTitles = new Set(defaultTimeline.map((section) => normalizeTimelineKey(section.title)));
  const hasOptimizedTimeline = savedSections.some((section) => {
    const idMatches = typeof section.id === "string" && defaultIds.has(section.id);
    const titleMatches = typeof section.title === "string" && defaultTitles.has(normalizeTimelineKey(section.title));

    return idMatches || titleMatches;
  });

  return defaultTimeline.map((fallbackSection) => {
    const saved = byId.get(fallbackSection.id) ?? byTitle.get(normalizeTimelineKey(fallbackSection.title));
    if (!saved || !Array.isArray(saved.tasks)) {
      return fallbackSection;
    }

    const savedTasks = (saved.tasks as unknown[])
      .filter((task): task is Partial<TimelineTask> & Record<string, unknown> => typeof task === "object" && task !== null)
      .map((task) => normalizeTimelineTask(task))
      .filter((task) => task.text);

    return {
      ...fallbackSection,
      tasks: hasOptimizedTimeline ? savedTasks : fallbackSection.tasks,
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

function normalizeRunsheetItem(raw: Partial<RunsheetItem> & Record<string, unknown>): RunsheetItem {
  return {
    ...emptyRunsheetItemForm,
    id: typeof raw.id === "string" ? raw.id : createId("runsheet-item"),
    time: typeof raw.time === "string" ? raw.time : "",
    title: typeof raw.title === "string" ? raw.title : "",
    category: typeof raw.category === "string" ? raw.category : "Morning Prep",
    location: typeof raw.location === "string" ? raw.location : "",
    owner: typeof raw.owner === "string" ? raw.owner : "",
    notes: typeof raw.notes === "string" ? raw.notes : "",
    vendorId: typeof raw.vendorId === "string" ? raw.vendorId : "",
    status: isOneOf(raw.status, runsheetStatuses) ? raw.status : "Draft",
    internalOnly: Boolean(raw.internalOnly),
    buffer: Boolean(raw.buffer),
  };
}

function normalizeRunsheetRole(raw: Partial<RunsheetRole> & Record<string, unknown>): RunsheetRole {
  return {
    id: typeof raw.id === "string" ? raw.id : createId("runsheet-role"),
    role: typeof raw.role === "string" ? raw.role : "",
    person: typeof raw.person === "string" ? raw.person : "",
    responsibility: typeof raw.responsibility === "string" ? raw.responsibility : "",
  };
}

function normalizeRunsheetChecklistItem(raw: Partial<RunsheetChecklistItem> & Record<string, unknown>): RunsheetChecklistItem {
  return {
    id: typeof raw.id === "string" ? raw.id : createId("runsheet-check"),
    text: typeof raw.text === "string" ? raw.text : "",
    done: Boolean(raw.done),
  };
}

function normalizeRunsheetNotes(value: unknown): RunsheetNotes {
  if (typeof value !== "object" || value === null) {
    return emptyRunsheetNotes;
  }

  const raw = value as Partial<RunsheetNotes>;

  return {
    wetWeatherPlan: typeof raw.wetWeatherPlan === "string" ? raw.wetWeatherPlan : "",
    vendorContacts: typeof raw.vendorContacts === "string" ? raw.vendorContacts : "",
    familyPhotoList: typeof raw.familyPhotoList === "string" ? raw.familyPhotoList : "",
    speechOrder: typeof raw.speechOrder === "string" ? raw.speechOrder : "",
    songList: typeof raw.songList === "string" ? raw.songList : "",
    decorStylingSetup: typeof raw.decorStylingSetup === "string" ? raw.decorStylingSetup : "",
    ceremonySetup: typeof raw.ceremonySetup === "string" ? raw.ceremonySetup : "",
    receptionSetup: typeof raw.receptionSetup === "string" ? raw.receptionSetup : "",
    dietaryAllergyNotes: typeof raw.dietaryAllergyNotes === "string" ? raw.dietaryAllergyNotes : "",
    transportNotes: typeof raw.transportNotes === "string" ? raw.transportNotes : "",
    packDownNotes: typeof raw.packDownNotes === "string" ? raw.packDownNotes : "",
    itemsToBring: typeof raw.itemsToBring === "string" ? raw.itemsToBring : "",
    itemsToCollect: typeof raw.itemsToCollect === "string" ? raw.itemsToCollect : "",
  };
}

function normalizeRunsheet(value: unknown): Runsheet {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return emptyRunsheet;
  }

  const raw = value as Partial<Runsheet> & Record<string, unknown>;
  const rawAlternateEnding =
    typeof raw.alternateEnding === "object" && raw.alternateEnding !== null && !Array.isArray(raw.alternateEnding)
      ? (raw.alternateEnding as Partial<Runsheet["alternateEnding"]> & Record<string, unknown>)
      : {};

  return {
    items: Array.isArray(raw.items)
      ? (raw.items as unknown[])
          .filter((item): item is Partial<RunsheetItem> & Record<string, unknown> => typeof item === "object" && item !== null)
          .map((item) => normalizeRunsheetItem(item))
      : emptyRunsheet.items,
    alternateEnding: {
      title: typeof rawAlternateEnding.title === "string" ? rawAlternateEnding.title : emptyRunsheet.alternateEnding.title,
      notes: Array.isArray(rawAlternateEnding.notes)
        ? rawAlternateEnding.notes.filter((note): note is string => typeof note === "string")
        : emptyRunsheet.alternateEnding.notes,
      items: Array.isArray(rawAlternateEnding.items)
        ? (rawAlternateEnding.items as unknown[])
            .filter((item): item is Partial<RunsheetItem> & Record<string, unknown> => typeof item === "object" && item !== null)
            .map((item) => normalizeRunsheetItem(item))
        : emptyRunsheet.alternateEnding.items,
    },
    roles: Array.isArray(raw.roles)
      ? (raw.roles as unknown[])
          .filter((role): role is Partial<RunsheetRole> & Record<string, unknown> => typeof role === "object" && role !== null)
          .map((role) => normalizeRunsheetRole(role))
      : emptyRunsheet.roles,
    confirmationChecklist: Array.isArray(raw.confirmationChecklist)
      ? (raw.confirmationChecklist as unknown[])
          .filter((item): item is Partial<RunsheetChecklistItem> & Record<string, unknown> => typeof item === "object" && item !== null)
          .map((item) => normalizeRunsheetChecklistItem(item))
      : emptyRunsheet.confirmationChecklist,
    notes: normalizeRunsheetNotes(raw.notes),
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

function TextAreaField({
  label,
  value,
  onChange,
  placeholder = "",
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="grid gap-2">
      <FieldLabel>{label}</FieldLabel>
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-24 resize-y rounded-2xl border border-[#eaded6] bg-white/80 px-4 py-3 text-sm leading-6 text-[#3f302b] outline-none transition duration-300 ease-out placeholder:text-[#a99790] focus:border-[#b98278]"
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
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-[#8c7a72]">Auto-saved securely</p>
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
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[#eaded6] bg-[#fffaf7] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8c7a72]">
                  {section.category}
                </span>
                <span className="rounded-full border border-[#eaded6] bg-white/64 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9b6f68]">
                  {section.priority} priority
                </span>
              </div>
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

const runsheetNoteFields: Array<{ key: keyof RunsheetNotes; label: string; placeholder: string }> = [
  { key: "wetWeatherPlan", label: "Wet-weather plan", placeholder: "Backup ceremony location, timing changes, guest directions..." },
  { key: "vendorContacts", label: "Vendor contacts", placeholder: "Supplier names, mobile numbers, emergency contacts..." },
  { key: "familyPhotoList", label: "Family photo list", placeholder: "Exact photo combinations and family wrangler notes..." },
  { key: "speechOrder", label: "Speech order and max length", placeholder: "Speaker order, rough timing, maximum speech length..." },
  { key: "songList", label: "Song list", placeholder: "Processional, signing, entrance, first dance, final song..." },
  { key: "decorStylingSetup", label: "Decor/styling setup notes", placeholder: "Signage, table styling, florals, hire items, placement notes..." },
  { key: "ceremonySetup", label: "Ceremony setup notes", placeholder: "Chairs, aisle, signing table, microphones, reserved seats..." },
  { key: "receptionSetup", label: "Reception setup notes", placeholder: "Floorplan, place cards, menus, bar, cake table, gift table..." },
  { key: "dietaryAllergyNotes", label: "Dietary/allergy notes", placeholder: "Venue/catering notes for meal service and allergies..." },
  { key: "transportNotes", label: "Transport notes", placeholder: "Cars, pickup windows, guest transport, end-of-night plan..." },
  { key: "packDownNotes", label: "Pack-down notes", placeholder: "Supplier pickup, hire returns, leftover cake/flowers, gifts/cards..." },
  { key: "itemsToBring", label: "Items to bring", placeholder: "Rings, vow cards, detail box, emergency kit, confetti..." },
  { key: "itemsToCollect", label: "Items to collect at end of night", placeholder: "Cards, gifts, signage, flowers, keepsakes, cake, personal items..." },
];

function parseRunsheetStartMinutes(time: string) {
  const match = time.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);

  if (!match) {
    return Number.POSITIVE_INFINITY;
  }

  let hour = Number(match[1]);
  const minutes = Number(match[2] ?? "0");
  const meridiem = match[3].toUpperCase();

  if (meridiem === "PM" && hour !== 12) {
    hour += 12;
  }

  if (meridiem === "AM" && hour === 12) {
    hour = 0;
  }

  return hour * 60 + minutes;
}

function getRunsheetGroup(item: RunsheetItem): RunsheetGroupName {
  const minutes = parseRunsheetStartMinutes(item.time);

  if (minutes < 15 * 60) {
    return "Morning Prep";
  }

  if (minutes < 17 * 60) {
    return "Ceremony";
  }

  if (minutes < 18 * 60) {
    return "Cocktail Hour / Portraits";
  }

  if (minutes < 21 * 60 + 5) {
    return "Reception";
  }

  return "Party / Farewell";
}

function getRunsheetStatusClass(status: RunsheetStatus) {
  if (status === "Confirmed") {
    return "border-[#d7e2cf] bg-[#eef5e9] text-[#52634a]";
  }

  if (status === "Needs confirmation" || status === "Optional / Needs confirmation") {
    return "border-[#ead7bf] bg-[#f8eddb] text-[#8a6c45]";
  }

  if (status === "Optional") {
    return "border-[#eaded6] bg-white/70 text-[#8c7a72]";
  }

  return "border-[#eaded6] bg-[#f4ebe4] text-[#6a5d55]";
}

function reorderRunsheetItems<T extends { id: string }>(items: T[], itemId: string, direction: -1 | 1) {
  const currentIndex = items.findIndex((item) => item.id === itemId);
  const nextIndex = currentIndex + direction;

  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= items.length) {
    return items;
  }

  const nextItems = [...items];
  const [item] = nextItems.splice(currentIndex, 1);
  nextItems.splice(nextIndex, 0, item);
  return nextItems;
}

function RunsheetVendorSelect({
  value,
  vendors,
  onChange,
}: {
  value: string;
  vendors: Vendor[];
  onChange: (vendorId: string) => void;
}) {
  const selectedVendorStillExists = !value || vendors.some((vendor) => vendor.id === value);

  return (
    <label className="grid gap-2">
      <FieldLabel>Vendor / Supplier</FieldLabel>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 rounded-2xl border border-[#eaded6] bg-white/80 px-4 text-sm text-[#3f302b] outline-none transition duration-300 ease-out focus:border-[#b98278]"
      >
        <option value="">No vendor association</option>
        {!selectedVendorStillExists && <option value={value}>Linked vendor no longer listed</option>}
        {vendors.map((vendor) => (
          <option key={vendor.id} value={vendor.id}>
            {vendor.vendorName || vendor.category}
          </option>
        ))}
      </select>
    </label>
  );
}

function RunsheetItemEditor({
  item,
  vendors,
  canMoveUp,
  canMoveDown,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  item: RunsheetItem;
  vendors: Vendor[];
  canMoveUp: boolean;
  canMoveDown: boolean;
  onChange: (updates: Partial<RunsheetItem>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div className="rounded-[1.1rem] border border-[#eaded6] bg-white/58 p-4 shadow-[0_10px_24px_rgba(90,65,50,0.035)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--color-navy)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-cta-text)]">
              {item.time || "Time TBC"}
            </span>
            <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${getRunsheetStatusClass(item.status)}`}>
              {item.status}
            </span>
            {item.buffer && <Chip tone="champagne">Buffer</Chip>}
            {item.internalOnly && <Chip tone="rose">Internal only</Chip>}
          </div>
          <h3 className="font-serif text-2xl leading-tight text-[#8f6a63]">{item.title || "Untitled runsheet item"}</h3>
          <p className="mt-1 text-sm leading-6 text-[#6a5d55]">
            {item.category || "Uncategorised"} - {item.location || "Location TBC"}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            aria-label={`Move ${item.title} earlier`}
            className="rounded-full border border-[#eaded6] bg-[#fffaf7] p-2 text-[#6a5d55] transition hover:border-[#b98278] disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            aria-label={`Move ${item.title} later`}
            className="rounded-full border border-[#eaded6] bg-[#fffaf7] p-2 text-[#6a5d55] transition hover:border-[#b98278] disabled:cursor-not-allowed disabled:opacity-35"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${item.title}`}
            className="rounded-full border border-[#eaded6] bg-[#fffaf7] p-2 text-[#9b6f68] transition hover:border-[#b98278]"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <TextField label="Time" value={item.time} onChange={(time) => onChange({ time })} placeholder="4:00 PM" />
        <TextField label="Title" value={item.title} onChange={(title) => onChange({ title })} />
        <TextField label="Category" value={item.category} onChange={(category) => onChange({ category })} />
        <TextField label="Location" value={item.location} onChange={(location) => onChange({ location })} />
        <TextField label="Owner / Responsible person" value={item.owner} onChange={(owner) => onChange({ owner })} />
        <SelectField label="Status" value={item.status} options={runsheetStatuses} onChange={(status) => onChange({ status })} />
        <RunsheetVendorSelect vendors={vendors} value={item.vendorId} onChange={(vendorId) => onChange({ vendorId })} />
      </div>

      <div className="mt-3">
        <TextAreaField label="Private notes" value={item.notes} onChange={(notes) => onChange({ notes })} rows={3} />
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs font-medium uppercase tracking-[0.12em] text-[#6a5d55]">
        <label className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#eaded6] bg-[#fffaf7] px-4">
          <input type="checkbox" checked={item.internalOnly} onChange={(event) => onChange({ internalOnly: event.target.checked })} className="accent-[#b98278]" />
          Internal only
        </label>
        <label className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#eaded6] bg-[#fffaf7] px-4">
          <input type="checkbox" checked={item.buffer} onChange={(event) => onChange({ buffer: event.target.checked })} className="accent-[#b98278]" />
          Buffer
        </label>
      </div>
    </div>
  );
}

function RunsheetTab({
  runsheet,
  setRunsheet,
  vendors,
}: {
  runsheet: Runsheet;
  setRunsheet: (runsheet: Runsheet) => void;
  vendors: Vendor[];
}) {
  const [newItem, setNewItem] = useState<RunsheetItemForm>(emptyRunsheetItemForm);
  const [newConfirmation, setNewConfirmation] = useState("");

  function updateItem(itemId: string, updates: Partial<RunsheetItem>) {
    setRunsheet({
      ...runsheet,
      items: runsheet.items.map((item) => (item.id === itemId ? { ...item, ...updates } : item)),
    });
  }

  function deleteItem(itemId: string) {
    setRunsheet({
      ...runsheet,
      items: runsheet.items.filter((item) => item.id !== itemId),
    });
  }

  function moveItem(itemId: string, direction: -1 | 1) {
    setRunsheet({
      ...runsheet,
      items: reorderRunsheetItems(runsheet.items, itemId, direction),
    });
  }

  function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newItem.title.trim();
    const time = newItem.time.trim();

    if (!title || !time) {
      return;
    }

    setRunsheet({
      ...runsheet,
      items: [...runsheet.items, { ...newItem, id: createId("runsheet-item"), title, time }],
    });
    setNewItem(emptyRunsheetItemForm);
  }

  function updateAlternateItem(itemId: string, updates: Partial<RunsheetItem>) {
    setRunsheet({
      ...runsheet,
      alternateEnding: {
        ...runsheet.alternateEnding,
        items: runsheet.alternateEnding.items.map((item) => (item.id === itemId ? { ...item, ...updates } : item)),
      },
    });
  }

  function deleteAlternateItem(itemId: string) {
    setRunsheet({
      ...runsheet,
      alternateEnding: {
        ...runsheet.alternateEnding,
        items: runsheet.alternateEnding.items.filter((item) => item.id !== itemId),
      },
    });
  }

  function moveAlternateItem(itemId: string, direction: -1 | 1) {
    setRunsheet({
      ...runsheet,
      alternateEnding: {
        ...runsheet.alternateEnding,
        items: reorderRunsheetItems(runsheet.alternateEnding.items, itemId, direction),
      },
    });
  }

  function updateRole(roleId: string, updates: Partial<RunsheetRole>) {
    setRunsheet({
      ...runsheet,
      roles: runsheet.roles.map((role) => (role.id === roleId ? { ...role, ...updates } : role)),
    });
  }

  function addRole() {
    setRunsheet({
      ...runsheet,
      roles: [
        ...runsheet.roles,
        {
          id: createId("runsheet-role"),
          role: "New role",
          person: "TBC",
          responsibility: "",
        },
      ],
    });
  }

  function deleteRole(roleId: string) {
    setRunsheet({
      ...runsheet,
      roles: runsheet.roles.filter((role) => role.id !== roleId),
    });
  }

  function toggleConfirmation(itemId: string) {
    setRunsheet({
      ...runsheet,
      confirmationChecklist: runsheet.confirmationChecklist.map((item) => (item.id === itemId ? { ...item, done: !item.done } : item)),
    });
  }

  function addConfirmation() {
    const text = newConfirmation.trim();

    if (!text) {
      return;
    }

    setRunsheet({
      ...runsheet,
      confirmationChecklist: [...runsheet.confirmationChecklist, { id: createId("runsheet-confirmation"), text, done: false }],
    });
    setNewConfirmation("");
  }

  function deleteConfirmation(itemId: string) {
    setRunsheet({
      ...runsheet,
      confirmationChecklist: runsheet.confirmationChecklist.filter((item) => item.id !== itemId),
    });
  }

  const totalItems = runsheet.items.length;
  const confirmedItems = runsheet.items.filter((item) => item.status === "Confirmed").length;
  const needsConfirmation = runsheet.items.filter((item) => item.status === "Needs confirmation" || item.status === "Optional / Needs confirmation").length;
  const groupedItems = runsheetGroupNames.map((group) => ({
    group,
    items: runsheet.items.filter((item) => getRunsheetGroup(item) === group),
  }));

  return (
    <div className="grid gap-6">
      <PlanningCard>
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="heading-micro">Private Runsheet</p>
            <h2 className="heading-secondary mt-2">Wedding Day Runsheet</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#6a5d55]">
              Sunday, 1 November 2026 at Caversham House. Ceremony at Garden House at 4:00 PM, with an elegant sit-down dinner reception and an assumed 11:00 PM finish until the venue confirms otherwise.
            </p>
          </div>
          <div className="grid gap-2 text-sm text-[#6a5d55] sm:grid-cols-3 lg:min-w-[420px]">
            <div className="rounded-2xl border border-[#eaded6] bg-white/62 p-4">
              <p className="heading-micro">Items</p>
              <p className="mt-2 font-serif text-3xl text-[#8f6a63]">{totalItems}</p>
            </div>
            <div className="rounded-2xl border border-[#eaded6] bg-white/62 p-4">
              <p className="heading-micro">Confirmed</p>
              <p className="mt-2 font-serif text-3xl text-[#52634a]">{confirmedItems}</p>
            </div>
            <div className="rounded-2xl border border-[#eaded6] bg-white/62 p-4">
              <p className="heading-micro">To Confirm</p>
              <p className="mt-2 font-serif text-3xl text-[#8a6c45]">{needsConfirmation}</p>
            </div>
          </div>
        </div>
      </PlanningCard>

      {groupedItems.map(({ group, items }) => (
        <section key={group} className="grid gap-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="heading-micro">Chronological Group</p>
              <h3 className="mt-1 font-serif text-3xl text-[#8f6a63]">{group}</h3>
            </div>
            <Chip>{items.length} items</Chip>
          </div>
          {items.map((item) => {
            const itemIndex = runsheet.items.findIndex((candidate) => candidate.id === item.id);

            return (
              <RunsheetItemEditor
                key={item.id}
                item={item}
                vendors={vendors}
                canMoveUp={itemIndex > 0}
                canMoveDown={itemIndex >= 0 && itemIndex < runsheet.items.length - 1}
                onChange={(updates) => updateItem(item.id, updates)}
                onDelete={() => deleteItem(item.id)}
                onMoveUp={() => moveItem(item.id, -1)}
                onMoveDown={() => moveItem(item.id, 1)}
              />
            );
          })}
        </section>
      ))}

      <PlanningCard>
        <p className="heading-micro">Add Timing</p>
        <h3 className="heading-secondary heading-secondary-compact mt-2">Add Runsheet Item</h3>
        <form onSubmit={addItem} className="mt-5 grid gap-3 md:grid-cols-2">
          <TextField label="Time" value={newItem.time} onChange={(time) => setNewItem({ ...newItem, time })} placeholder="7:00 PM" />
          <TextField label="Title" value={newItem.title} onChange={(title) => setNewItem({ ...newItem, title })} />
          <TextField label="Category" value={newItem.category} onChange={(category) => setNewItem({ ...newItem, category })} />
          <TextField label="Location" value={newItem.location} onChange={(location) => setNewItem({ ...newItem, location })} />
          <TextField label="Owner / Responsible person" value={newItem.owner} onChange={(owner) => setNewItem({ ...newItem, owner })} />
          <SelectField label="Status" value={newItem.status} options={runsheetStatuses} onChange={(status) => setNewItem({ ...newItem, status })} />
          <RunsheetVendorSelect vendors={vendors} value={newItem.vendorId} onChange={(vendorId) => setNewItem({ ...newItem, vendorId })} />
          <div className="md:col-span-2">
            <TextAreaField label="Private notes" value={newItem.notes} onChange={(notes) => setNewItem({ ...newItem, notes })} rows={3} />
          </div>
          <div className="flex flex-wrap gap-3 md:col-span-2">
            <label className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#eaded6] bg-[#fffaf7] px-4 text-xs font-medium uppercase tracking-[0.12em] text-[#6a5d55]">
              <input type="checkbox" checked={newItem.internalOnly} onChange={(event) => setNewItem({ ...newItem, internalOnly: event.target.checked })} className="accent-[#b98278]" />
              Internal only
            </label>
            <label className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#eaded6] bg-[#fffaf7] px-4 text-xs font-medium uppercase tracking-[0.12em] text-[#6a5d55]">
              <input type="checkbox" checked={newItem.buffer} onChange={(event) => setNewItem({ ...newItem, buffer: event.target.checked })} className="accent-[#b98278]" />
              Buffer
            </label>
          </div>
          <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-navy)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-cta-text)] shadow-[0_12px_30px_rgba(35,38,58,0.18)] transition hover:bg-[var(--color-navy-hover)] md:col-span-2 md:w-fit">
            <Plus className="h-4 w-4" />
            Add item
          </button>
        </form>
      </PlanningCard>

      <PlanningCard>
        <p className="heading-micro">Private Option</p>
        <TextField
          label="Alternate ending title"
          value={runsheet.alternateEnding.title}
          onChange={(title) => setRunsheet({ ...runsheet, alternateEnding: { ...runsheet.alternateEnding, title } })}
        />
        <div className="mt-4 rounded-2xl border border-[#eaded6] bg-white/54 p-4">
          <p className="heading-micro">Guidance</p>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-[#6a5d55]">
            {runsheet.alternateEnding.notes.map((note, index) => (
              <li key={`${note}-${index}`}>- {note}</li>
            ))}
          </ul>
        </div>
        <div className="mt-4 grid gap-3">
          {runsheet.alternateEnding.items.map((item, index) => (
            <RunsheetItemEditor
              key={item.id}
              item={item}
              vendors={vendors}
              canMoveUp={index > 0}
              canMoveDown={index < runsheet.alternateEnding.items.length - 1}
              onChange={(updates) => updateAlternateItem(item.id, updates)}
              onDelete={() => deleteAlternateItem(item.id)}
              onMoveUp={() => moveAlternateItem(item.id, -1)}
              onMoveDown={() => moveAlternateItem(item.id, 1)}
            />
          ))}
        </div>
      </PlanningCard>

      <PlanningCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="heading-micro">Private Roles</p>
            <h3 className="heading-secondary heading-secondary-compact mt-2">Roles & Jobs</h3>
          </div>
          <button type="button" onClick={addRole} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#eaded6] bg-[#fffaf7] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#6a5d55] transition hover:border-[#b98278]">
            <Plus className="h-4 w-4" />
            Add role
          </button>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {runsheet.roles.map((role) => (
            <div key={role.id} className="rounded-2xl border border-[#eaded6] bg-white/58 p-4">
              <div className="grid gap-3">
                <TextField label="Role" value={role.role} onChange={(value) => updateRole(role.id, { role: value })} />
                <TextField label="Person" value={role.person} onChange={(person) => updateRole(role.id, { person })} />
                <TextAreaField label="Responsibility" value={role.responsibility} onChange={(responsibility) => updateRole(role.id, { responsibility })} rows={3} />
              </div>
              <button type="button" onClick={() => deleteRole(role.id)} className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#eaded6] bg-[#fffaf7] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#9b6f68] transition hover:border-[#b98278]">
                <Trash2 className="h-4 w-4" />
                Remove role
              </button>
            </div>
          ))}
        </div>
      </PlanningCard>

      <PlanningCard>
        <p className="heading-micro">Private Checklist</p>
        <h3 className="heading-secondary heading-secondary-compact mt-2">Needs Confirmation</h3>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {runsheet.confirmationChecklist.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-3 rounded-2xl border border-[#eaded6] bg-white/58 px-4 py-3">
              <label className="flex flex-1 cursor-pointer items-start gap-3">
                <input type="checkbox" checked={item.done} onChange={() => toggleConfirmation(item.id)} className="mt-1 h-4 w-4 accent-[#b98278]" />
                <span className={`text-sm leading-6 ${item.done ? "text-[#8c7a72] line-through" : "text-[#4f4641]"}`}>{item.text}</span>
              </label>
              <button type="button" onClick={() => deleteConfirmation(item.id)} aria-label={`Delete ${item.text}`} className="rounded-full p-1.5 text-[#9b6f68] hover:bg-[#f4ebe4]">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={newConfirmation}
            onChange={(event) => setNewConfirmation(event.target.value)}
            placeholder="Add confirmation item"
            className="min-h-11 flex-1 rounded-2xl border border-[#eaded6] bg-white/80 px-4 text-sm outline-none focus:border-[#b98278]"
          />
          <button type="button" onClick={addConfirmation} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#eaded6] bg-[#fffaf7] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#6a5d55] transition hover:border-[#b98278]">
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
      </PlanningCard>

      <PlanningCard>
        <p className="heading-micro">Internal Notes</p>
        <h3 className="heading-secondary heading-secondary-compact mt-2">Wedding Day Notes</h3>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {runsheetNoteFields.map((field) => (
            <TextAreaField
              key={field.key}
              label={field.label}
              value={runsheet.notes[field.key]}
              placeholder={field.placeholder}
              rows={4}
              onChange={(value) =>
                setRunsheet({
                  ...runsheet,
                  notes: {
                    ...runsheet.notes,
                    [field.key]: value,
                  },
                })
              }
            />
          ))}
        </div>
      </PlanningCard>
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
          <p className="mt-3 text-xs uppercase tracking-[0.2em] text-[#8c7a72]">Auto-saved securely</p>
        </PlanningCard>
      ))}
    </div>
  );
}

type PrivatePlanningFileDto = {
  id: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  vendorId: string | null;
  paymentId: string | null;
  scanStatus: string;
  uploadedAt: string | null;
  createdAt: string;
  extraction?: PrivatePlanningFileExtractionDto | null;
};

type PrivatePlanningExtractedVendor = {
  name: string | null;
  category: string | null;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
};

type PrivatePlanningExtractedDocument = {
  documentType: "invoice" | "receipt" | "quote" | "contract" | "unknown";
  invoiceNumber: string | null;
  receiptNumber: string | null;
  invoiceDate: string | null;
  dueDate: string | null;
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  currency: string | null;
};

type PrivatePlanningExtractionConfidence = {
  vendor: number;
  contact: number;
  amounts: number;
  dates: number;
};

type PrivatePlanningVendorMatch = {
  id: string;
  vendorName: string;
  category: string;
  email: string;
  phone: string;
  website: string;
  score: number;
  reasons: string[];
};

type PrivatePlanningVendorSuggestionDto = {
  id: string;
  fileId: string;
  suggestionStatus: string;
  suggestedVendor: PrivatePlanningExtractedVendor;
  suggestedDocument: PrivatePlanningExtractedDocument;
  confidence: PrivatePlanningExtractionConfidence;
  warnings: string[];
  possibleMatches: PrivatePlanningVendorMatch[];
  matchedVendorId: string | null;
  reviewedAt: string | null;
  appliedAt: string | null;
  dismissedAt: string | null;
};

type PrivatePlanningFileExtractionDto = {
  id: string;
  fileId: string;
  extractionStatus: string;
  extractedVendor: PrivatePlanningExtractedVendor | null;
  extractedDocument: PrivatePlanningExtractedDocument | null;
  confidence: PrivatePlanningExtractionConfidence | null;
  warnings: string[];
  errorMessage: string | null;
  matchedVendorId: string | null;
  reviewedAt: string | null;
  appliedAt: string | null;
  dismissedAt: string | null;
  suggestion: PrivatePlanningVendorSuggestionDto | null;
};

type VendorSuggestionForm = {
  name: string;
  category: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  address: string;
};

type PrivatePlanningFilesResponse = {
  ok: boolean;
  files?: PrivatePlanningFileDto[];
  storageConfigured?: boolean;
  extractionConfigured?: boolean;
  error?: string;
};

type PrivatePlanningUploadTicketResponse = {
  ok: boolean;
  ticket?: {
    id: string;
    storageKey: string;
    mimeType: string;
    maxSize: number;
  };
  error?: string;
};

type PrivatePlanningExtractionResponse = {
  ok: boolean;
  extraction?: PrivatePlanningFileExtractionDto | null;
  error?: string;
};

type PrivatePlanningSuggestionApplyResponse = {
  ok: boolean;
  action?: "create" | "link";
  vendor?: Vendor;
  vendorId?: string;
  error?: string;
};

function suggestionFormFromVendor(vendor?: PrivatePlanningExtractedVendor | null): VendorSuggestionForm {
  return {
    name: vendor?.name ?? "",
    category: vendor?.category ?? "",
    contactName: vendor?.contactName ?? "",
    email: vendor?.email ?? "",
    phone: vendor?.phone ?? "",
    website: vendor?.website ?? "",
    address: vendor?.address ?? "",
  };
}

function getFileExtractionStatus(file: PrivatePlanningFileDto) {
  const suggestionStatus = file.extraction?.suggestion?.suggestionStatus;
  const extractionStatus = file.extraction?.extractionStatus;

  if (suggestionStatus === "applied" || suggestionStatus === "linked" || extractionStatus === "applied" || extractionStatus === "linked") {
    return "linked";
  }

  if (suggestionStatus === "review_needed" || extractionStatus === "review_needed") {
    return "review_needed";
  }

  if (suggestionStatus === "dismissed" || extractionStatus === "dismissed") {
    return "dismissed";
  }

  if (extractionStatus === "extracting") {
    return "extracting";
  }

  if (extractionStatus === "failed") {
    return "failed";
  }

  return "not_extracted";
}

function getFileExtractionStatusLabel(status: string) {
  const labels: Record<string, string> = {
    not_extracted: "Not extracted",
    extracting: "Extracting",
    review_needed: "Review needed",
    linked: "Linked to vendor",
    failed: "Failed",
    dismissed: "Dismissed",
  };

  return labels[status] ?? status;
}

function FilesTab({ vendors, setVendors }: { vendors: Vendor[]; setVendors: (vendors: Vendor[]) => void }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<PrivatePlanningFileDto[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [isStorageConfigured, setIsStorageConfigured] = useState(true);
  const [isExtractionConfigured, setIsExtractionConfigured] = useState(true);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [autoExtractAfterUpload, setAutoExtractAfterUpload] = useState(true);
  const [extractingFileId, setExtractingFileId] = useState<string | null>(null);
  const [applyingSuggestionId, setApplyingSuggestionId] = useState<string | null>(null);
  const [reviewForms, setReviewForms] = useState<Record<string, VendorSuggestionForm>>({});
  const [linkSelections, setLinkSelections] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const vendorNameById = useMemo(() => new Map(vendors.map((vendor) => [vendor.id, vendor.vendorName])), [vendors]);
  const acceptedFileTypes = `${privatePlanningAllowedMimeTypes.join(",")},.pdf,.png,.jpg,.jpeg,.webp`;

  const loadFiles = useCallback(async () => {
    setIsLoadingFiles(true);

    try {
      const response = await fetch("/api/private-planning/files", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const result = (await response.json().catch(() => null)) as PrivatePlanningFilesResponse | null;

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error ?? "Could not load private files.");
      }

      const nextFiles = result.files ?? [];
      setFiles(nextFiles);
      setReviewForms((current) => {
        const next = { ...current };

        for (const file of nextFiles) {
          const suggestion = file.extraction?.suggestion;

          if (suggestion && suggestion.suggestionStatus === "review_needed" && !next[suggestion.id]) {
            next[suggestion.id] = suggestionFormFromVendor(suggestion.suggestedVendor);
          }
        }

        return next;
      });
      setLinkSelections((current) => {
        const next = { ...current };

        for (const file of nextFiles) {
          const suggestion = file.extraction?.suggestion;
          const matchId = suggestion?.matchedVendorId ?? suggestion?.possibleMatches[0]?.id ?? "";

          if (suggestion && matchId && !next[suggestion.id]) {
            next[suggestion.id] = matchId;
          }
        }

        return next;
      });
      const storageConfigured = Boolean(result.storageConfigured);
      const extractionConfigured = result.extractionConfigured !== false;

      setIsStorageConfigured(storageConfigured);
      setIsExtractionConfigured(extractionConfigured);

      if (!storageConfigured) {
        setStatusMessage("Private Blob storage is not configured yet.");
      } else if (!extractionConfigured) {
        setStatusMessage("AI vendor extraction is not configured yet. Add OPENAI_API_KEY in Vercel to enable Extract Details.");
      }

      return nextFiles;
    } catch (error) {
      console.error("Private planning file list failed.", error);
      setStatusMessage("Private files could not be loaded.");
      return [];
    } finally {
      setIsLoadingFiles(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadFiles();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadFiles]);

  function validateClientFile(file: File) {
    const extension = getPrivatePlanningFileExtension(file.name);
    const expectedMimeType = getPrivatePlanningMimeForExtension(extension);

    if (!expectedMimeType) {
      return "Only PDF, PNG, JPG, JPEG, and WebP files are allowed.";
    }

    if (file.size <= 0 || file.size > PRIVATE_PLANNING_MAX_FILE_BYTES) {
      return "Files must be 10 MB or smaller.";
    }

    if (file.type && file.type !== expectedMimeType) {
      return "The file extension and browser-reported type do not match.";
    }

    return "";
  }

  async function extractFile(fileId: string, force = false) {
    if (!isExtractionConfigured) {
      setStatusMessage("AI vendor extraction is not configured yet. Add OPENAI_API_KEY in Vercel to enable Extract Details.");
      return;
    }

    setExtractingFileId(fileId);
    setStatusMessage(force ? "Re-running private extraction..." : "Extracting vendor details privately...");

    try {
      const response = await fetch(`/api/private-planning/files/${fileId}/extract`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [PRIVATE_PLANNING_CSRF_HEADER]: "1",
        },
        body: JSON.stringify({ force }),
        cache: "no-store",
        credentials: "same-origin",
      });
      const result = (await response.json().catch(() => null)) as PrivatePlanningExtractionResponse | null;

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error ?? "Could not extract details from this file.");
      }

      setStatusMessage("Vendor details detected. Review before applying.");
      await loadFiles();
    } catch (error) {
      console.error("Private planning extraction failed.", error);
      setStatusMessage(error instanceof Error ? error.message : "Extraction failed.");
      await loadFiles();
    } finally {
      setExtractingFileId(null);
    }
  }

  function updateReviewForm(suggestionId: string, patch: Partial<VendorSuggestionForm>) {
    setReviewForms((current) => ({
      ...current,
      [suggestionId]: {
        ...suggestionFormFromVendor(),
        ...(current[suggestionId] ?? {}),
        ...patch,
      },
    }));
  }

  async function applySuggestion(suggestion: PrivatePlanningVendorSuggestionDto, action: "create" | "link") {
    setApplyingSuggestionId(suggestion.id);

    try {
      const response = await fetch(`/api/private-planning/vendor-suggestions/${suggestion.id}/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [PRIVATE_PLANNING_CSRF_HEADER]: "1",
        },
        body: JSON.stringify(
          action === "link"
            ? {
                action,
                vendorId: linkSelections[suggestion.id] ?? suggestion.matchedVendorId ?? suggestion.possibleMatches[0]?.id,
              }
            : {
                action,
                vendor: reviewForms[suggestion.id] ?? suggestionFormFromVendor(suggestion.suggestedVendor),
              },
        ),
        cache: "no-store",
        credentials: "same-origin",
      });
      const result = (await response.json().catch(() => null)) as PrivatePlanningSuggestionApplyResponse | null;

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error ?? "Could not apply this suggestion.");
      }

      if (action === "create" && result.vendor) {
        setVendors([result.vendor, ...vendors.filter((vendor) => vendor.id !== result.vendor?.id)]);
      }

      setStatusMessage(action === "link" ? "File linked to an existing vendor." : "Vendor created from the document suggestion.");
      await loadFiles();
    } catch (error) {
      console.error("Private planning suggestion apply failed.", error);
      setStatusMessage(error instanceof Error ? error.message : "Could not apply that suggestion.");
    } finally {
      setApplyingSuggestionId(null);
    }
  }

  async function dismissSuggestion(suggestion: PrivatePlanningVendorSuggestionDto) {
    setApplyingSuggestionId(suggestion.id);

    try {
      const response = await fetch(`/api/private-planning/vendor-suggestions/${suggestion.id}/dismiss`, {
        method: "POST",
        headers: {
          [PRIVATE_PLANNING_CSRF_HEADER]: "1",
        },
        cache: "no-store",
        credentials: "same-origin",
      });
      const result = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

      if (!response.ok || !result?.ok) {
        throw new Error(result?.error ?? "Could not dismiss this suggestion.");
      }

      setStatusMessage("Suggestion dismissed. You can re-run extraction manually.");
      await loadFiles();
    } catch (error) {
      console.error("Private planning suggestion dismiss failed.", error);
      setStatusMessage(error instanceof Error ? error.message : "Could not dismiss that suggestion.");
    } finally {
      setApplyingSuggestionId(null);
    }
  }

  async function uploadSelectedFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const validationError = validateClientFile(file);

    if (validationError) {
      setStatusMessage(validationError);
      event.target.value = "";
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setStatusMessage("Preparing secure upload...");

    try {
      const ticketResponse = await fetch("/api/private-planning/files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [PRIVATE_PLANNING_CSRF_HEADER]: "1",
        },
        body: JSON.stringify({
          originalFilename: file.name,
          size: file.size,
          vendorId: selectedVendorId || undefined,
        }),
        cache: "no-store",
        credentials: "same-origin",
      });
      const ticketResult = (await ticketResponse.json().catch(() => null)) as PrivatePlanningUploadTicketResponse | null;

      if (!ticketResponse.ok || !ticketResult?.ok || !ticketResult.ticket) {
        throw new Error(ticketResult?.error ?? "Could not prepare the upload.");
      }

      setStatusMessage("Uploading privately...");

      await upload(ticketResult.ticket.storageKey, file, {
        access: "private",
        contentType: ticketResult.ticket.mimeType,
        handleUploadUrl: "/api/private-planning/files/upload",
        clientPayload: JSON.stringify({
          fileId: ticketResult.ticket.id,
          storageKey: ticketResult.ticket.storageKey,
        }),
        headers: {
          [PRIVATE_PLANNING_CSRF_HEADER]: "1",
        },
        multipart: file.size > 4 * 1024 * 1024,
        onUploadProgress: (progress) => setUploadProgress(progress.percentage),
      });

      setStatusMessage("Upload complete. Validating file before it appears in the vault...");
      await new Promise((resolve) => {
        window.setTimeout(resolve, 1200);
      });
      let loadedFiles = await loadFiles();

      if (autoExtractAfterUpload && !isExtractionConfigured) {
        setStatusMessage("Upload complete. AI vendor extraction is not configured yet. Add OPENAI_API_KEY in Vercel to enable auto-extraction.");
      } else if (autoExtractAfterUpload) {
        for (let attempt = 0; attempt < 3 && !loadedFiles.some((item) => item.id === ticketResult.ticket?.id && item.uploadedAt); attempt += 1) {
          await new Promise((resolve) => {
            window.setTimeout(resolve, 1000);
          });
          loadedFiles = await loadFiles();
        }

        if (loadedFiles.some((item) => item.id === ticketResult.ticket?.id && item.uploadedAt)) {
          await extractFile(ticketResult.ticket.id);
        } else {
          setStatusMessage("Upload is still validating. Use Extract Details once the file appears as ready.");
        }
      }
    } catch (error) {
      console.error("Private planning file upload failed.", error);
      setStatusMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      event.target.value = "";
    }
  }

  async function deleteFile(file: PrivatePlanningFileDto) {
    const confirmed = window.confirm(`Delete ${file.originalFilename}? This removes the private file and its metadata.`);

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/private-planning/files/${file.id}`, {
        method: "DELETE",
        headers: {
          [PRIVATE_PLANNING_CSRF_HEADER]: "1",
        },
        cache: "no-store",
        credentials: "same-origin",
      });
      const result = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        throw new Error(result?.error ?? "Could not delete that file.");
      }

      setStatusMessage("Private file deleted.");
      await loadFiles();
    } catch (error) {
      console.error("Private planning file delete failed.", error);
      setStatusMessage(error instanceof Error ? error.message : "Delete failed.");
    }
  }

  function renderExtractionReview(file: PrivatePlanningFileDto) {
    const suggestion = file.extraction?.suggestion;

    if (!suggestion || suggestion.suggestionStatus !== "review_needed") {
      return null;
    }

    const form = reviewForms[suggestion.id] ?? suggestionFormFromVendor(suggestion.suggestedVendor);
    const selectedLinkId = linkSelections[suggestion.id] ?? suggestion.matchedVendorId ?? suggestion.possibleMatches[0]?.id ?? "";
    const isApplying = applyingSuggestionId === suggestion.id;

    return (
      <div className="mt-5 rounded-[1.15rem] border border-[#eaded6] bg-white/54 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="heading-micro">Vendor details detected</p>
            <h4 className="mt-2 font-serif text-2xl text-[#3f302b]">{form.name || "Unnamed vendor"}</h4>
            <p className="mt-2 text-sm leading-6 text-[#6a5d55]">
              Review these fields before creating a vendor. Bank, card, tax, and identity numbers are intentionally ignored.
            </p>
          </div>
          <Chip tone="rose">Needs review</Chip>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <TextField label="Vendor name" value={form.name} onChange={(name) => updateReviewForm(suggestion.id, { name })} />
          <label className="grid gap-2">
            <FieldLabel>Category</FieldLabel>
            <select
              value={form.category}
              onChange={(event) => updateReviewForm(suggestion.id, { category: event.target.value })}
              className="min-h-11 rounded-2xl border border-[#eaded6] bg-white/80 px-4 text-sm text-[#3f302b] outline-none transition duration-300 ease-out focus:border-[#b98278]"
            >
              <option value="">Choose category</option>
              {vendorCategories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
          <TextField label="Contact person" value={form.contactName} onChange={(contactName) => updateReviewForm(suggestion.id, { contactName })} />
          <TextField label="Email" value={form.email} onChange={(email) => updateReviewForm(suggestion.id, { email })} />
          <TextField label="Phone" value={form.phone} onChange={(phone) => updateReviewForm(suggestion.id, { phone })} />
          <TextField label="Website" value={form.website} onChange={(website) => updateReviewForm(suggestion.id, { website })} />
          <label className="grid gap-2 md:col-span-2">
            <FieldLabel>Address</FieldLabel>
            <textarea
              value={form.address}
              onChange={(event) => updateReviewForm(suggestion.id, { address: event.target.value })}
              rows={3}
              className="rounded-2xl border border-[#eaded6] bg-white/80 px-4 py-3 text-sm leading-6 text-[#3f302b] outline-none transition duration-300 ease-out focus:border-[#b98278]"
            />
          </label>
        </div>

        <div className="mt-4 grid gap-3 text-sm leading-6 text-[#6a5d55] md:grid-cols-2">
          <div className="rounded-2xl bg-[#fffaf7]/74 p-4">
            <FieldLabel>Document</FieldLabel>
            <p className="mt-2 capitalize">{suggestion.suggestedDocument.documentType}</p>
            <p>{suggestion.suggestedDocument.invoiceNumber ? `Invoice ${suggestion.suggestedDocument.invoiceNumber}` : "No invoice number detected"}</p>
            <p>
              {suggestion.suggestedDocument.total !== null
                ? `${suggestion.suggestedDocument.currency ?? ""} ${suggestion.suggestedDocument.total}`
                : "No total detected"}
            </p>
          </div>
          <div className="rounded-2xl bg-[#fffaf7]/74 p-4">
            <FieldLabel>Confidence</FieldLabel>
            <p className="mt-2">Vendor {Math.round(suggestion.confidence.vendor * 100)}%</p>
            <p>Contact {Math.round(suggestion.confidence.contact * 100)}%</p>
            <p>Amounts {Math.round(suggestion.confidence.amounts * 100)}%</p>
          </div>
        </div>

        {(suggestion.possibleMatches.length > 0 || vendors.length > 0) && (
          <div className="mt-4 rounded-2xl border border-[#eaded6] bg-[#fffaf7]/64 p-4">
            <FieldLabel>Link existing vendor</FieldLabel>
            {suggestion.possibleMatches.length > 0 && (
              <p className="mt-2 text-sm leading-6 text-[#6a5d55]">
                Possible match: {suggestion.possibleMatches.map((match) => `${match.vendorName} (${Math.round(match.score * 100)}%)`).join(", ")}
              </p>
            )}
            <select
              value={selectedLinkId}
              onChange={(event) => setLinkSelections((current) => ({ ...current, [suggestion.id]: event.target.value }))}
              className="mt-3 min-h-11 w-full rounded-2xl border border-[#eaded6] bg-white/80 px-4 text-sm text-[#3f302b] outline-none transition duration-300 ease-out focus:border-[#b98278]"
            >
              <option value="">Choose existing vendor</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.vendorName}
                </option>
              ))}
            </select>
          </div>
        )}

        {suggestion.warnings.length > 0 && (
          <div className="mt-4 rounded-2xl bg-[#f8e8e4]/70 px-4 py-3 text-sm leading-6 text-[#7d6b62]">
            {suggestion.warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => applySuggestion(suggestion, "create")}
            disabled={isApplying}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-navy)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-cta-text)] shadow-[0_12px_30px_rgba(35,38,58,0.18)] transition hover:bg-[var(--color-navy-hover)] disabled:cursor-not-allowed disabled:opacity-55"
          >
            <Plus className="h-4 w-4" />
            Create Vendor
          </button>
          <button
            type="button"
            onClick={() => applySuggestion(suggestion, "link")}
            disabled={isApplying || !selectedLinkId}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#eaded6] bg-white/68 px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#3f302b] transition hover:border-[#b98278] disabled:cursor-not-allowed disabled:opacity-55"
          >
            <CheckCircle2 className="h-4 w-4" />
            Link Existing
          </button>
          <button
            type="button"
            onClick={() => dismissSuggestion(suggestion)}
            disabled={isApplying}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#eaded6] bg-white/40 px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#9b6f68] transition hover:border-[#b98278] disabled:cursor-not-allowed disabled:opacity-55"
          >
            <X className="h-4 w-4" />
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <PlanningCard>
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="heading-micro">Private Files</p>
            <h2 className="heading-secondary heading-secondary-compact mt-2">Invoices & Receipts</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6a5d55]">
              Files are uploaded to private storage, validated after upload, and served only through authenticated downloads.
              AI extraction runs server-side and creates review-only vendor suggestions that you can edit, link, create, or dismiss.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:min-w-[320px]">
            <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7d6b62]">
              Vendor
              <select
                value={selectedVendorId}
                onChange={(event) => setSelectedVendorId(event.target.value)}
                className="min-h-11 rounded-2xl border border-[#eaded6] bg-white/80 px-4 text-sm normal-case tracking-normal text-[#3f302b] outline-none transition duration-300 ease-out focus:border-[#b98278]"
              >
                <option value="">No vendor association</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.vendorName}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-start gap-3 rounded-2xl border border-[#eaded6] bg-white/50 px-4 py-3 text-sm leading-6 text-[#6a5d55]">
              <input
                type="checkbox"
                checked={autoExtractAfterUpload}
                onChange={(event) => setAutoExtractAfterUpload(event.target.checked)}
                disabled={!isExtractionConfigured}
                className="mt-1 h-4 w-4 accent-[var(--color-navy)]"
              />
              <span>
                Auto-extract vendor details after upload
                {!isExtractionConfigured && (
                  <span className="mt-1 block text-xs leading-5 text-[#9b6f68]">
                    Needs OPENAI_API_KEY in Vercel.
                  </span>
                )}
              </span>
            </label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={!isStorageConfigured || isUploading}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-navy)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-cta-text)] shadow-[0_12px_30px_rgba(35,38,58,0.18)] transition hover:bg-[var(--color-navy-hover)] disabled:cursor-not-allowed disabled:opacity-55"
            >
              <FileUp className="h-4 w-4" />
              {isUploading ? `Uploading ${Math.round(uploadProgress)}%` : "Upload File"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedFileTypes}
              onChange={uploadSelectedFile}
              className="hidden"
            />
          </div>
        </div>
        {statusMessage && <p className="mt-5 rounded-2xl bg-white/58 px-4 py-3 text-sm leading-6 text-[#6a5d55]">{statusMessage}</p>}
      </PlanningCard>

      <div className="grid gap-4">
        {isLoadingFiles ? (
          <PlanningCard>
            <p className="text-sm leading-7 text-[#6a5d55]">Loading private files...</p>
          </PlanningCard>
        ) : files.length > 0 ? (
          files.map((file) => {
            const extractionStatus = getFileExtractionStatus(file);
            const canRunExtraction = extractionStatus !== "extracting" && extractionStatus !== "review_needed" && extractionStatus !== "linked";

            return (
            <PlanningCard key={file.id}>
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-4">
                  <span className="rounded-full bg-[#f4ebe4] p-3 text-[#b98278]">
                    <Paperclip className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-serif text-2xl text-[#3f302b]">{file.originalFilename}</h3>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs uppercase tracking-[0.14em] text-[#7d6b62]">
                      <span>{formatPrivatePlanningFileSize(file.size)}</span>
                      <span>{file.mimeType}</span>
                      <span>{file.uploadedAt ? formatDate(file.uploadedAt.slice(0, 10)) : "Processing"}</span>
                      <span>{file.vendorId ? vendorNameById.get(file.vendorId) ?? "Vendor linked" : "No vendor"}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Chip tone={extractionStatus === "review_needed" ? "rose" : extractionStatus === "linked" ? "sage" : extractionStatus === "failed" ? "champagne" : "neutral"}>
                        {getFileExtractionStatusLabel(extractionStatus)}
                      </Chip>
                      <p className="text-sm leading-6 text-[#6a5d55]">Scan status: {file.scanStatus}. Download only.</p>
                    </div>
                    {file.extraction?.errorMessage && <p className="mt-2 text-sm leading-6 text-[#9b6f68]">{file.extraction.errorMessage}</p>}
                    {!isExtractionConfigured && (
                      <p className="mt-2 text-sm leading-6 text-[#9b6f68]">
                        AI extraction is unavailable until OPENAI_API_KEY is added in Vercel.
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  {canRunExtraction && (
                    <button
                      type="button"
                      onClick={() => extractFile(file.id, extractionStatus === "dismissed" || extractionStatus === "failed")}
                      disabled={extractingFileId === file.id || !isExtractionConfigured}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-[#eaded6] bg-white/68 px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#3f302b] transition hover:border-[#b98278] disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      <FileText className="h-4 w-4" />
                      {!isExtractionConfigured
                        ? "Extraction Unavailable"
                        : extractingFileId === file.id
                          ? "Extracting"
                          : extractionStatus === "dismissed" || extractionStatus === "failed"
                            ? "Run Again"
                            : "Extract Details"}
                    </button>
                  )}
                  <a
                    href={`/api/private-planning/files/${file.id}/download`}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[#eaded6] bg-white/68 px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#3f302b] transition hover:border-[#b98278]"
                  >
                    <FileDown className="h-4 w-4" />
                    Download
                  </a>
                  <button
                    type="button"
                    onClick={() => deleteFile(file)}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[#eaded6] bg-white/40 px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#9b6f68] transition hover:border-[#b98278]"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
              {renderExtractionReview(file)}
            </PlanningCard>
            );
          })
        ) : (
          <PlanningCard>
            <p className="text-sm leading-7 text-[#6a5d55]">No private invoices or receipts have been uploaded yet.</p>
          </PlanningCard>
        )}
      </div>
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
  runsheet: Runsheet;
  quickNotes: string;
  notes: PlanningNotes;
};

type PlanningDataPayload = Omit<PlanningExport, "version" | "exportedAt">;

type PlanningDataApiResponse = {
  ok: boolean;
  hasData?: boolean;
  data?: Partial<PlanningDataPayload> | null;
  error?: string;
};

function normalizePlanningPayload(payload?: Partial<PlanningDataPayload> | null, legacyDecisionNotes = ""): PlanningDataPayload {
  return {
    vendors: normalizeVendors(payload?.vendors),
    events: normalizeEvents(payload?.events),
    tasks: normalizeTasks(payload?.tasks),
    timeline: normalizeTimeline(payload?.timeline),
    runsheet: normalizeRunsheet(payload?.runsheet),
    quickNotes: typeof payload?.quickNotes === "string" ? payload.quickNotes : "",
    notes: normalizeNotes(payload?.notes, legacyDecisionNotes),
  };
}

function buildPlanningPayload(
  vendors: Vendor[],
  events: CalendarEvent[],
  tasks: PlanningTask[],
  timeline: TimelineSection[],
  runsheet: Runsheet,
  quickNotes: string,
  notes: PlanningNotes,
): PlanningDataPayload {
  return {
    vendors,
    events,
    tasks,
    timeline,
    runsheet,
    quickNotes,
    notes,
  };
}

function readLegacyPlanningPayload() {
  // Security migration: previous dashboard builds used localStorage as the data source;
  // these reads only preserve a one-time handoff before clearing browser storage.
  const hasLegacyData = LEGACY_PLANNING_STORAGE_KEYS.some((key) => getLocalRawValue(key) !== null);

  if (!hasLegacyData) {
    return { hasLegacyData: false, payload: null, legacyDecisionNotes: "" };
  }

  const legacyDecisionNotes = parseStoredValue(LEGACY_DECISION_NOTES_KEY, "");

  return {
    hasLegacyData: true,
    legacyDecisionNotes,
    payload: {
      vendors: parseStoredValue<Vendor[]>(VENDORS_KEY, defaultVendors),
      events: parseStoredValue<CalendarEvent[]>(EVENTS_KEY, defaultCalendarEvents),
      tasks: parseStoredValue<PlanningTask[]>(TASKS_KEY, defaultTasks),
      timeline: parseStoredValue<TimelineSection[]>(TIMELINE_KEY, defaultTimeline),
      quickNotes: parseStoredValue(QUICK_NOTES_KEY, ""),
      notes: parseStoredValue<PlanningNotes>(NOTES_KEY, defaultNotes),
    },
  };
}

function PlanningDashboardContent({ initialTab = "Overview" }: { initialTab?: Tab }) {
  const shouldReduceMotion = useReducedMotion();
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const skipNextPersistRef = useRef(true);
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [storedVendors, setStoredVendors] = useState<Vendor[]>(defaultVendors);
  const [storedEvents, setStoredEvents] = useState<CalendarEvent[]>(defaultCalendarEvents);
  const [storedTasks, setStoredTasks] = useState<PlanningTask[]>(defaultTasks);
  const [storedTimeline, setStoredTimeline] = useState<TimelineSection[]>(defaultTimeline);
  const [storedRunsheet, setStoredRunsheet] = useState<Runsheet>(emptyRunsheet);
  const [quickNotes, setQuickNotes] = useState("");
  const [legacyDecisionNotes, setLegacyDecisionNotes] = useState("");
  const [storedNotes, setStoredNotes] = useState<PlanningNotes>(defaultNotes);
  const [isPlanningDataLoaded, setIsPlanningDataLoaded] = useState(false);
  const [planningDataStatus, setPlanningDataStatus] = useState("Loading secure planning data...");
  const vendors = useMemo(() => normalizeVendors(storedVendors), [storedVendors]);
  const events = useMemo(() => normalizeEvents(storedEvents), [storedEvents]);
  const tasks = useMemo(() => normalizeTasks(storedTasks), [storedTasks]);
  const timeline = useMemo(() => normalizeTimeline(storedTimeline), [storedTimeline]);
  const runsheet = useMemo(() => normalizeRunsheet(storedRunsheet), [storedRunsheet]);
  const notes = useMemo(() => normalizeNotes(storedNotes, legacyDecisionNotes), [legacyDecisionNotes, storedNotes]);
  const planningSummary = useMemo(() => getPlanningSummary(vendors, events, tasks), [events, tasks, vendors]);
  const setVendors = useCallback((next: Vendor[]) => setStoredVendors(normalizeVendors(next)), [setStoredVendors]);
  const setEvents = useCallback((next: CalendarEvent[]) => setStoredEvents(normalizeEvents(next)), [setStoredEvents]);
  const setTasks = useCallback((next: PlanningTask[]) => setStoredTasks(normalizeTasks(next)), [setStoredTasks]);
  const setTimeline = useCallback((next: TimelineSection[]) => setStoredTimeline(normalizeTimeline(next)), [setStoredTimeline]);
  const setRunsheet = useCallback((next: Runsheet) => setStoredRunsheet(normalizeRunsheet(next)), [setStoredRunsheet]);
  const setNotes = useCallback((next: PlanningNotes) => setStoredNotes(normalizeNotes(next)), [setStoredNotes]);
  const applyPlanningPayload = useCallback((payload: PlanningDataPayload) => {
    setStoredVendors(payload.vendors);
    setStoredEvents(payload.events);
    setStoredTasks(payload.tasks);
    setStoredTimeline(payload.timeline);
    setStoredRunsheet(payload.runsheet);
    setQuickNotes(payload.quickNotes);
    setLegacyDecisionNotes("");
    setStoredNotes(payload.notes);
  }, []);
  const savePlanningPayload = useCallback(async (payload: PlanningDataPayload, signal?: AbortSignal) => {
    const response = await fetch(PRIVATE_PLANNING_DATA_ENDPOINT, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        [PRIVATE_PLANNING_CSRF_HEADER]: "1",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      credentials: "same-origin",
      signal,
    });
    const result = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      throw new Error(result?.error ?? "Could not save private planning data.");
    }
  }, []);
  const reveal = {
    initial: shouldReduceMotion ? false : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: shouldReduceMotion ? 0 : 0.55, ease: revealEase },
  };

  useEffect(() => {
    let isCurrent = true;

    async function loadPlanningData() {
      try {
        const response = await fetch(PRIVATE_PLANNING_DATA_ENDPOINT, {
          cache: "no-store",
          credentials: "same-origin",
        });

        if (response.status === 401) {
          window.location.reload();
          return;
        }

        const result = (await response.json().catch(() => null)) as PlanningDataApiResponse | null;

        if (!response.ok || !result?.ok) {
          throw new Error(result?.error ?? "Could not load private planning data.");
        }

        const legacyPlanningData = readLegacyPlanningPayload();
        const serverSeedPayload = result.data && typeof result.data === "object" ? result.data : null;
        const mergedLegacyPayload = {
          ...(serverSeedPayload ?? {}),
          ...(legacyPlanningData.payload ?? {}),
        };
        const payload =
          result.hasData && result.data
            ? normalizePlanningPayload(result.data)
            : legacyPlanningData.hasLegacyData
              ? normalizePlanningPayload(mergedLegacyPayload, legacyPlanningData.legacyDecisionNotes)
              : normalizePlanningPayload(serverSeedPayload);

        if (!isCurrent) {
          return;
        }

        skipNextPersistRef.current = true;
        applyPlanningPayload(payload);
        setIsPlanningDataLoaded(true);

        if (!result.hasData && legacyPlanningData.hasLegacyData) {
          await savePlanningPayload(payload);
          clearLegacyPlanningStorage();

          if (isCurrent) {
            setPlanningDataStatus("Migrated to secure server storage.");
          }

          return;
        }

        clearLegacyPlanningStorage();
        setPlanningDataStatus("Auto-saved securely.");
      } catch (error) {
        console.error("Private planning dashboard load failed.", error);

        if (isCurrent) {
          setPlanningDataStatus("Secure planning data could not be loaded.");
        }
      }
    }

    loadPlanningData();

    return () => {
      isCurrent = false;
    };
  }, [applyPlanningPayload, savePlanningPayload]);

  useEffect(() => {
    if (!isPlanningDataLoaded) {
      return undefined;
    }

    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return undefined;
    }

    const controller = new AbortController();
    const payload = buildPlanningPayload(vendors, events, tasks, timeline, runsheet, quickNotes, notes);
    const timeoutId = window.setTimeout(() => {
      setPlanningDataStatus("Saving securely...");

      savePlanningPayload(payload, controller.signal)
        .then(() => {
          clearLegacyPlanningStorage();
          setPlanningDataStatus("Auto-saved securely.");
        })
        .catch((error) => {
          if (controller.signal.aborted) {
            return;
          }

          console.error("Private planning dashboard save failed.", error);
          setPlanningDataStatus("Secure auto-save failed. Export a backup before leaving.");
        });
    }, 700);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [events, isPlanningDataLoaded, notes, quickNotes, runsheet, savePlanningPayload, tasks, timeline, vendors]);

  function exportPlanningData() {
    const confirmed = window.confirm(
      "This exports private planning data, including the private wedding-day runsheet. Guest list exports are handled separately in the Guests tab and include sensitive personal data.",
    );

    if (!confirmed) {
      return;
    }

    const payload: PlanningExport = {
      version: 1,
      exportedAt: new Date().toISOString(),
      vendors,
      events,
      tasks,
      timeline,
      runsheet,
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
      setRunsheet(normalizeRunsheet(payload.runsheet));
      setQuickNotes(typeof payload.quickNotes === "string" ? payload.quickNotes : "");
      setNotes(normalizeNotes(payload.notes));
    } catch {
      window.alert("That JSON file could not be imported.");
    } finally {
      event.target.value = "";
    }
  }

  async function logout() {
    await fetch("/api/private-planning/logout", {
      method: "POST",
      cache: "no-store",
      credentials: "same-origin",
    }).catch(() => null);

    clearLegacyPlanningStorage();
    window.location.reload();
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

    if (activeTab === "Runsheet") {
      return <RunsheetTab runsheet={runsheet} setRunsheet={setRunsheet} vendors={vendors} />;
    }

    if (activeTab === "Guests") {
      return <PrivatePlanningGuestsTab />;
    }

    if (activeTab === "Files") {
      return <FilesTab vendors={vendors} setVendors={setVendors} />;
    }

    return <NotesTab notes={notes} setNotes={setNotes} />;
  }, [activeTab, events, notes, quickNotes, runsheet, setEvents, setNotes, setQuickNotes, setRunsheet, setTasks, setTimeline, setVendors, tasks, timeline, vendors]);

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
            <div className="flex flex-col gap-3 lg:items-end">
              <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7d6b62]">
                <ShieldCheck className="h-4 w-4 text-[#b98278]" />
                {planningDataStatus}
              </p>
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={exportPlanningData} className="inline-flex items-center justify-center gap-2 rounded-full border border-[#eaded6] bg-white/68 px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#3f302b] transition hover:border-[#b98278]">
                  <Download className="h-4 w-4" />
                  Export Planning JSON
                </button>
                <button type="button" onClick={() => importInputRef.current?.click()} className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-navy)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-cta-text)] shadow-[0_12px_30px_rgba(35,38,58,0.18)] transition hover:bg-[var(--color-navy-hover)]">
                  <Upload className="h-4 w-4" />
                  Import Planning JSON
                </button>
                <button type="button" onClick={logout} className="inline-flex items-center justify-center rounded-full border border-[#eaded6] bg-white/50 px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#6a5d55] transition hover:border-[#b98278]">
                  Log out
                </button>
                <input ref={importInputRef} type="file" accept="application/json" onChange={importPlanningData} className="hidden" />
              </div>
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

export default function PrivatePlanningDashboard({ initialTab = "Overview" }: { initialTab?: Tab }) {
  return <PlanningDashboardContent initialTab={initialTab} />;
}
