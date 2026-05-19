"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

const WEDDING_DAY_ROLES_HELPERS_KEY = "weddingDayRolesHelpers";
const innerRevealEase = [0.19, 1, 0.22, 1] as const;

const pageAnchors = [
  { href: "#updates", label: "UPDATES" },
  { href: "#details", label: "ESSENTIALS" },
  { href: "#dress-diary", label: "DRESS DIARY" },
  { href: "#lookbooks", label: "LOOKBOOKS" },
  { href: "#dates", label: "DATES" },
  { href: "#roles", label: "HELP" },
  { href: "#contact", label: "CONTACT" },
];

type LookbookCategory = {
  id: string;
  label: string;
  brief: string;
  weLove: string;
  avoid: string;
  comfort: string;
  palette: Array<{ name: string; hex: string }>;
  guide?: {
    eyebrow: string;
    title: string;
    intro: string;
    poster?: {
      src: string;
      alt: string;
    };
    notes: Array<{ title: string; copy: string }>;
    footer: string;
  };
  images: Array<{
    src: string;
    title: string;
    caption: string;
    why: string;
  }>;
};

type DayRole = {
  id: string;
  title: string;
  copy: string;
};

type RoleHelperNames = {
  name1: string;
  name2: string;
};

type RoleHelperMap = Record<string, RoleHelperNames>;

type InnerCircleDateEvent = {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  notes?: string;
};

type HelpingHandResponse = {
  name: string;
  helpWith: string[];
  note: string;
  submittedAt: string;
  updatedAt?: string;
};

const lookbooks: LookbookCategory[] = [
  {
    id: "bridal-party",
    label: "Bridal Party",
    brief: "",
    weLove: "Flowing fabrics, soft silhouettes, romantic details, subtle texture, and movement.",
    avoid: "Neon colours, loud prints, overly casual fabrics, or anything that clashes with the soft garden palette.",
    comfort: "Choose pieces that move easily through garden paths, photos, hugs, dinner, and dancing.",
    palette: [],
    guide: {
      eyebrow: "BRIDAL PARTY MORNING GUIDE",
      title: "Getting Ready Lookbook",
      intro: "A soft reference for robes, jewellery, hair, makeup, nails, footwear, and morning-prep details.",
      poster: {
        src: "/images/lookbooks/bridal-party-getting-ready.png",
        alt: "Getting Ready Lookbook for the bridal party with robe, jewellery, hair, makeup, nail, and footwear notes.",
      },
      notes: [
        { title: "Robes", copy: "Wear your robe on arrival so the morning photos feel cohesive and relaxed." },
        { title: "Jewellery", copy: "Please wear your gifted necklace on the day. For earrings, bracelets, and rings, choose pieces that complement the soft romantic aesthetic." },
        { title: "Hair", copy: "Come with clean, dry hair unless the hair team confirms otherwise." },
        { title: "Makeup", copy: "Makeup before getting-ready photos so the morning gallery feels polished." },
        { title: "Nails", copy: "Soft neutral, blush, or French tones are preferred." },
        { title: "Footwear", copy: "Nude or neutral slippers or sandals will keep the morning look soft and photo-ready." },
      ],
      footer: "Final bridal party details will be confirmed separately. This guide is for visual direction and calm morning flow.",
    },
    images: [],
  },
  {
    id: "grooms-party",
    label: "Groom's Party",
    brief: "Classic formal tailoring with clean lines, polished shoes, and refined neutral tones.",
    weLove: "Navy, charcoal, black, beige, crisp shirts, champagne or blush accents, and thoughtful finishing details.",
    avoid: "Casual sneakers, loud ties, clashing accessories, or anything that feels too informal.",
    comfort: "Tailoring should fit well, breathe well, and hold its shape from ceremony to dance floor.",
    palette: [
      { name: "Navy", hex: "#1F2A44" },
      { name: "Charcoal", hex: "#4B4A49" },
      { name: "Black", hex: "#171513" },
      { name: "Beige", hex: "#CBB7A1" },
      { name: "Champagne", hex: "#E7D4B8" },
      { name: "Blush accent", hex: "#C08A7A" },
    ],
    guide: {
      eyebrow: "GROOM PARTY MORNING GUIDE",
      title: "Getting Ready Lookbook",
      intro: "A polished reference for attire, florals, accessories, grooming, footwear, and relaxed morning photos.",
      poster: {
        src: "/images/lookbooks/groom-party-getting-ready.png",
        alt: "Getting Ready Lookbook for the groom party with attire, colour, floral, accessory, grooming, footwear, and photo notes.",
      },
      notes: [
        { title: "Arrive dressed", copy: "Please arrive fully dressed and photo-ready. Relaxed getting-ready photos will begin shortly after arrival, so everything should already be on." },
        { title: "Colour direction", copy: "The groom party will be in navy tones with blush accents. Please make sure your outfit aligns with this for a cohesive look." },
        { title: "Grooms lady look", copy: "Please come dressed in your coordinated outfit for the day. Keep styling soft and complementary to the navy and blush palette. Corsage will be provided." },
        { title: "Florals", copy: "Florals will be provided on the day. The groom and groomsman will wear boutonnieres, and the groomslady will wear a corsage. These will be handed out just before the ceremony." },
        { title: "Accessories", copy: "Watches and personal accessories are welcome. Keep them clean, minimal, and in line with the overall look." },
        { title: "Grooming", copy: "Please arrive groomed and ready. Hair should be styled or close to final." },
        { title: "Footwear", copy: "Black or dark brown formal shoes, clean and polished." },
        { title: "Photo note", copy: "Getting-ready photos will focus on relaxed moments. No outfit changes are required." },
      ],
      footer: "Just show up ready. We will take care of the rest.",
    },
    images: [],
  },
];

const keyDetails = [
  { label: "Wedding date", value: "Sunday, 1 November 2026" },
  { label: "Venue", value: "Caversham House, Swan Valley" },
  { label: "Ceremony", value: "4:00 PM at Garden House" },
  { label: "Style", value: "Elegant garden romance, pastel formal" },
  { label: "Main priority", value: "Be present, enjoy the day, and bring your calm, happy energy." },
  { label: "Privacy note", value: "This page is just for our inner circle - please don't share dress photos or private details outside this group." },
];

const latestUpdates = [
  "Dress Diary space added",
  "Getting ready lookbook updated",
  "Next date to hold: RSVP deadline",
  "Last updated: 19 May 2026",
];

const dressDiaryPhotos: Array<{
  id: string;
  src: string;
  alt: string;
  caption: string;
  date?: string;
  tag?: string;
}> = [];

const keyDates = [
  {
    date: "1 September 2026",
    title: "RSVP deadline",
  },
  {
    date: "Mid-late October 2026",
    title: "Final outfit checks, beauty appointments, packing, and wedding-week prep",
  },
  {
    date: "31 October 2026",
    title: "Wedding eve",
  },
  {
    date: "1 November 2026",
    title: "Wedding day",
  },
];

const weekReminders = [
  "Try on your full outfit before the wedding week.",
  "Break in shoes if needed.",
  "Steam or press outfits before the day.",
  "Pack anything you need for getting ready.",
  "Keep phones charged.",
  "Bring snacks, water, and any personal medication.",
  "Let us know early if anything changes.",
  "Bring your calmest, happiest energy.",
];

const dayRoles: DayRole[] = [
  {
    id: "timeline-lead",
    title: "Timeline lead",
    copy: "Keeps an eye on the day’s schedule and helps gently move people along when needed.",
  },
  {
    id: "family-photo-wrangler",
    title: "Family photo wrangler",
    copy: "Helps gather family members after the ceremony so group photos happen quickly and smoothly.",
  },
  {
    id: "confetti-lead",
    title: "Confetti lead",
    copy: "Makes sure confetti is handed out and guests are ready for the ceremony exit moment.",
  },
  {
    id: "touch-up-kit-keeper",
    title: "Touch-up kit keeper",
    copy: "Keeps lipstick, tissues, blotting paper, perfume, pins, and small beauty items nearby.",
  },
  {
    id: "emergency-kit-keeper",
    title: "Emergency kit keeper",
    copy: "Keeps just-in-case items nearby, such as plasters, pain relief, stain remover, fashion tape, and a sewing kit.",
  },
  {
    id: "gift-card-collector",
    title: "Gift & card collector",
    copy: "Makes sure cards and gifts are collected, kept safe, and taken to the right place at the end of the night.",
  },
  {
    id: "transport-helper",
    title: "Transport helper",
    copy: "Helps confirm the right people are in the right cars or transport at the right time.",
  },
];

const contactPlaceholders = [
  "General questions - TBC",
  "Wedding-day logistics - TBC",
  "Family photos - TBC",
  "Transport - TBC",
  "Emergency / urgent - TBC",
];

const helpingHandOptions = [
  "Morning preparations",
  "Welcoming or directing guests",
  "Photo gathering",
  "Transport coordination",
  "End-of-night cards, gifts, or keepsakes",
  "A little bit of anything",
];

function emptyRoleHelperNames(): RoleHelperNames {
  return { name1: "", name2: "" };
}

function normaliseRoleHelperMap(value: unknown): RoleHelperMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value as Record<string, unknown>).reduce<RoleHelperMap>((helpers, [roleId, names]) => {
    if (!names || typeof names !== "object" || Array.isArray(names)) {
      return helpers;
    }

    const maybeNames = names as Partial<RoleHelperNames>;
    const name1 = typeof maybeNames.name1 === "string" ? maybeNames.name1.trim() : "";
    const name2 = typeof maybeNames.name2 === "string" ? maybeNames.name2.trim() : "";

    if (name1 || name2) {
      helpers[roleId] = { name1, name2 };
    }

    return helpers;
  }, {});
}

function filterCurrentRoleHelpers(helpers: RoleHelperMap): RoleHelperMap {
  return dayRoles.reduce<RoleHelperMap>((currentHelpers, role) => {
    if (helpers[role.id]) {
      currentHelpers[role.id] = helpers[role.id];
    }

    return currentHelpers;
  }, {});
}

function readStoredRoleHelpers(): RoleHelperMap {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    return filterCurrentRoleHelpers(
      normaliseRoleHelperMap(JSON.parse(window.localStorage.getItem(WEDDING_DAY_ROLES_HELPERS_KEY) ?? "{}")),
    );
  } catch {
    return {};
  }
}

function createRoleHelperDrafts(helpers: RoleHelperMap = {}): RoleHelperMap {
  return dayRoles.reduce<RoleHelperMap>((drafts, role) => {
    drafts[role.id] = helpers[role.id] ?? emptyRoleHelperNames();
    return drafts;
  }, {});
}

function emptyHelpingHandResponse(): HelpingHandResponse {
  return {
    name: "",
    helpWith: [],
    note: "",
    submittedAt: "",
  };
}

function formatInnerCircleDate(date: string) {
  const normalizedDate = date.match(/^\d{4}-\d{2}-\d{2}$/) ? date : "";

  if (!normalizedDate) {
    return date;
  }

  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${normalizedDate}T00:00:00.000Z`));
}

function PrivateSection({
  children,
  className = "",
  contentClassName = "mx-auto max-w-5xl",
  id,
}: {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`inner-editorial-panel inner-private-section relative scroll-mt-8 overflow-hidden bg-[#fbf7f2] px-6 py-16 md:py-20 ${className}`}
    >
      <div className={`relative ${contentClassName}`}>{children}</div>
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  copy,
}: {
  eyebrow?: string;
  title: string;
  copy?: string;
}) {
  const shouldReduceMotion = useReducedMotion();
  const reveal = (delay = 0, y = 16) => ({
    initial: shouldReduceMotion ? false : { opacity: 0, y },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.42 },
    transition: { duration: shouldReduceMotion ? 0 : 0.9, delay: shouldReduceMotion ? 0 : delay, ease: innerRevealEase },
  });

  return (
    <div className="mx-auto mb-10 max-w-3xl text-center">
      {eyebrow && <motion.p className="heading-micro mb-3" {...reveal(0, 10)}>{eyebrow}</motion.p>}
      <motion.h2 className="heading-primary" {...reveal(0.12, 16)}>{title}</motion.h2>
      {copy && <motion.p className="heading-copy mx-auto mt-4 max-w-[620px]" {...reveal(0.24, 14)}>{copy}</motion.p>}
    </div>
  );
}

function SoftCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.24 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.86, ease: innerRevealEase }}
      className={`inner-soft-card rounded-[1.75rem] border border-[#eaded6] bg-[#fffaf7]/82 p-6 text-[#4f4641] shadow-[0_14px_38px_rgba(90,65,50,0.055)] ${className}`}
    >
      {children}
    </motion.div>
  );
}

function InnerCirclePrivacyNote({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[1.25rem] border border-[#eaded6]/70 bg-white/42 px-4 py-3 text-center shadow-[inset_0_0_0_1px_rgba(255,255,255,0.45)]">
      <p className="type-card-body text-[#7d6b62]">{children}</p>
    </div>
  );
}

function LatestUpdatesCard() {
  return (
    <PrivateSection id="updates" className="pt-6 md:pt-8" contentClassName="mx-auto max-w-4xl">
      <SoftCard className="p-6 md:p-8">
        <div className="grid gap-7 md:grid-cols-[0.85fr_1.15fr] md:items-start">
          <div>
            <p className="heading-micro mb-3">LATEST UPDATES</p>
            <h2 className="heading-secondary">What&rsquo;s new</h2>
            <p className="type-card-body mt-4">
              A few little things to check back on as the day gets closer.
            </p>
          </div>
          {latestUpdates.length > 0 ? (
            <div className="grid gap-3">
              {latestUpdates.map((item) => (
                <div key={item} className="rounded-2xl border border-[#eaded6]/72 bg-white/48 px-4 py-3">
                  <p className="type-card-body text-[#4f4641]">{item}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[#eaded6]/72 bg-white/48 px-4 py-4">
              <p className="type-card-body text-[#4f4641]">
                Nothing urgent for now &mdash; this is where we&rsquo;ll add little updates as plans are confirmed.
              </p>
            </div>
          )}
        </div>
      </SoftCard>
    </PrivateSection>
  );
}

function DressDiarySection() {
  return (
    <PrivateSection id="dress-diary" contentClassName="mx-auto max-w-6xl">
      <SectionHeading
        eyebrow="PRIVATE STYLE NOTES"
        title="Dress Diary"
        copy="A private little place for dress-trial photos, outfit thoughts, and the details we&rsquo;re slowly pulling together. These are just for our inner circle, so please keep them within this page."
      />

      {dressDiaryPhotos.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-3" aria-label="Private dress diary photo gallery">
          {dressDiaryPhotos.map((photo) => (
            <SoftCard key={photo.id} className="overflow-hidden p-3">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.35rem] border border-[#eaded6]/70 bg-[#fbf3ef]">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 768px) 92vw, 30vw"
                  className="object-cover"
                />
              </div>
              <div className="px-2 pb-2 pt-4 text-center">
                {photo.tag && <p className="heading-micro mb-2">{photo.tag}</p>}
                <p className="type-card-body text-[#4f4641]">{photo.caption}</p>
              </div>
            </SoftCard>
          ))}
        </div>
      ) : (
        <SoftCard className="mx-auto max-w-2xl text-center">
          <p className="luxe-serif-detail text-[1.28rem] text-[#3f302b]">
            Dress-trial photos will live here once we&rsquo;re ready to share them privately.
          </p>
        </SoftCard>
      )}

      <div className="mx-auto mt-6 max-w-2xl">
        <InnerCirclePrivacyNote>
          Please don&rsquo;t screenshot, repost, or share dress photos outside our inner circle.
        </InnerCirclePrivacyNote>
      </div>
    </PrivateSection>
  );
}

function RoleHelperSignup({
  role,
  savedNames,
  draftNames,
  error,
  isEditing,
  onChange,
  onEdit,
  onSave,
}: {
  role: DayRole;
  savedNames?: RoleHelperNames;
  draftNames: RoleHelperNames;
  error?: string;
  isEditing: boolean;
  onChange: (roleId: string, field: keyof RoleHelperNames, value: string) => void;
  onEdit: (roleId: string) => void;
  onSave: (roleId: string) => void;
}) {
  const savedHelperNames = [savedNames?.name1, savedNames?.name2].filter(Boolean).join(" & ");

  return (
    <div className="mt-6 rounded-[1.15rem] border border-[#eaded6]/60 bg-white/36 p-4">
      <div className="grid gap-3">
        <p className="type-card-body break-words" aria-live="polite">
          {savedHelperNames ? (
            <>
              <span className="font-semibold text-[#8f6a63]">Helpers:</span> {savedHelperNames}
            </>
          ) : (
            "May be helpful closer to the day."
          )}
        </p>

        {!isEditing && (
          <button
            type="button"
            onClick={() => onEdit(role.id)}
            className="w-fit text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#8f6a63] underline decoration-[#d8bdb6] decoration-1 underline-offset-4 transition hover:text-[#6f5750] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#cbb6af]/70"
          >
            {savedHelperNames ? "Edit helpers" : "Happy to help here"}
          </button>
        )}
      </div>

      {isEditing && (
        <form
          className="mt-4 grid gap-3 border-t border-[#eaded6]/60 pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSave(role.id);
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#8c7a72]" htmlFor={`${role.id}-helper-name-1`}>
              Your name
              <input
                id={`${role.id}-helper-name-1`}
                value={draftNames.name1}
                onChange={(event) => onChange(role.id, "name1", event.target.value)}
                className="min-w-0 rounded-full border border-[#eaded6] bg-[#fffaf7]/86 px-4 py-2.5 font-serif text-[1rem] normal-case tracking-normal text-[#4f4641] shadow-[inset_0_0_0_1px_rgba(255,248,244,0.5)] outline-none transition focus:border-[#cbb6af] focus:ring-2 focus:ring-[#e8cfc8]/45"
                autoComplete="name"
              />
            </label>

            <label className="grid gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#8c7a72]" htmlFor={`${role.id}-helper-name-2`}>
              Another name, optional
              <input
                id={`${role.id}-helper-name-2`}
                value={draftNames.name2}
                onChange={(event) => onChange(role.id, "name2", event.target.value)}
                className="min-w-0 rounded-full border border-[#eaded6] bg-[#fffaf7]/86 px-4 py-2.5 font-serif text-[1rem] normal-case tracking-normal text-[#4f4641] shadow-[inset_0_0_0_1px_rgba(255,248,244,0.5)] outline-none transition focus:border-[#cbb6af] focus:ring-2 focus:ring-[#e8cfc8]/45"
                autoComplete="name"
              />
            </label>
          </div>

          {error && (
            <p className="type-caption text-[#8f6a63]" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-fit rounded-full border border-[#d9c5bc] bg-[#fff8f4]/78 px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#8f6a63] shadow-[0_10px_24px_rgba(90,65,50,0.045)] transition hover:border-[#cbb6af] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#cbb6af]/70"
          >
            Save note
          </button>
        </form>
      )}
    </div>
  );
}

function UpcomingBridalPartyDatesSection() {
  const [events, setEvents] = useState<InnerCircleDateEvent[]>([]);
  const [hasLoadedEvents, setHasLoadedEvents] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleEvents = isExpanded ? events : events.slice(0, 3);
  const hasMoreEvents = events.length > 3;

  useEffect(() => {
    let isCancelled = false;

    async function loadUpcomingDates() {
      let nextEvents: InnerCircleDateEvent[] = [];

      try {
        const response = await fetch("/api/inner-circle/bridal-party-dates", { cache: "no-store" });

        if (response.ok) {
          const data = (await response.json()) as { events?: InnerCircleDateEvent[] };
          nextEvents = Array.isArray(data.events) ? data.events : [];
        }
      } catch (error) {
        console.error("Inner Circle upcoming dates load failed.", error);
      }

      if (!isCancelled) {
        setEvents(nextEvents);
        setHasLoadedEvents(true);
      }
    }

    void loadUpcomingDates();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <PrivateSection id="upcoming-dates" className="pt-4 md:pt-8">
      <SectionHeading
        eyebrow="UPCOMING DATES"
        title="Bridal party & fashion plans"
        copy="A few soft notes for fittings, outfit plans, and bridal party moments. We&rsquo;ll keep this updated as plans are confirmed."
      />

      {!hasLoadedEvents && (
        <SoftCard className="mx-auto max-w-2xl text-center">
          <p className="type-card-body">Loading upcoming dates...</p>
        </SoftCard>
      )}

      {hasLoadedEvents && events.length === 0 && (
        <SoftCard className="mx-auto max-w-2xl text-center">
          <p className="type-card-body">Nothing to action here yet &mdash; we&rsquo;ll add fitting dates, outfit notes, and little updates once they&rsquo;re confirmed.</p>
        </SoftCard>
      )}

      {hasLoadedEvents && events.length > 0 && (
        <>
          <div id="inner-circle-upcoming-dates-list" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {visibleEvents.map((event) => (
              <SoftCard key={event.id} className="p-5 md:p-6">
                <p className="heading-micro mb-3">{formatInnerCircleDate(event.date)}</p>
                <h3 className="break-words font-serif text-[1.38rem] leading-tight text-[#3f302b] md:text-[1.5rem]">
                  {event.title}
                </h3>

                {(event.time || event.location) && (
                  <div className="mt-4 grid gap-2">
                    {event.time && (
                      <p className="type-card-body break-words text-[#6f615c]">
                        <span className="font-semibold text-[#8f6a63]">Time:</span> {event.time}
                      </p>
                    )}
                    {event.location && (
                      <p className="type-card-body break-words text-[#6f615c]">
                        <span className="font-semibold text-[#8f6a63]">Location:</span> {event.location}
                      </p>
                    )}
                  </div>
                )}

                {event.notes && (
                  <p className="type-card-body mt-5 whitespace-pre-line break-words border-t border-[#eaded6]/70 pt-4 text-[#6f615c]">
                    {event.notes}
                  </p>
                )}
              </SoftCard>
            ))}
          </div>

          {hasMoreEvents && (
            <div className="mt-8 text-center">
              <button
                type="button"
                aria-controls="inner-circle-upcoming-dates-list"
                aria-expanded={isExpanded}
                onClick={() => setIsExpanded((currentValue) => !currentValue)}
                className="rounded-full border border-[#d9c5bc] bg-[#fff8f4]/78 px-5 py-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#8f6a63] shadow-[0_10px_24px_rgba(90,65,50,0.045)] transition hover:border-[#cbb6af] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#cbb6af]/70"
              >
                {isExpanded ? "Show fewer" : "View all dates"}
              </button>
            </div>
          )}
        </>
      )}
    </PrivateSection>
  );
}

function HelpingHandSection() {
  const [savedResponse, setSavedResponse] = useState<HelpingHandResponse | null>(null);
  const [draftResponse, setDraftResponse] = useState<HelpingHandResponse>(() => emptyHelpingHandResponse());
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasLoadedResponse, setHasLoadedResponse] = useState(false);
  const [error, setError] = useState("");
  const selectedOptions = draftResponse.helpWith;

  useEffect(() => {
    const loadResponseState = window.setTimeout(() => {
      setHasLoadedResponse(true);
    }, 0);

    return () => {
      window.clearTimeout(loadResponseState);
    };
  }, []);

  const toggleHelpOption = (option: string) => {
    setDraftResponse((currentResponse) => {
      const optionIsSelected = currentResponse.helpWith.includes(option);

      return {
        ...currentResponse,
        helpWith: optionIsSelected
          ? currentResponse.helpWith.filter((currentOption) => currentOption !== option)
          : [...currentResponse.helpWith, option],
      };
    });
    setError("");
  };

  const handleHelpingHandSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = draftResponse.name.trim();
    const note = draftResponse.note.trim();
    const helpWith = draftResponse.helpWith.filter((option) => helpingHandOptions.includes(option));

    if (!name) {
      setError("Please add your name.");
      return;
    }

    if (helpWith.length === 0) {
      setError("Please choose at least one way you would be happy to help.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/inner-circle/help", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-inner-circle-csrf": "1",
        },
        cache: "no-store",
        credentials: "same-origin",
        body: JSON.stringify({ name, helpWith, note, website: "" }),
      });
      const result = (await response.json().catch(() => null)) as {
        response?: HelpingHandResponse;
        error?: string;
      } | null;

      if (!response.ok || !result?.response) {
        setError(result?.error ?? "Something didn't save. Please try again, or just message us if that's easier.");
        return;
      }

      setSavedResponse(result.response);
      setDraftResponse(result.response);
      setIsEditing(false);
      setError("");
    } catch {
      setError("Something didn't save. Please try again, or just message us if that's easier.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const showForm = !savedResponse || isEditing;

  return (
    <PrivateSection id="helping-hand" contentClassName="mx-auto max-w-4xl">
      <div className="mx-auto mb-10 max-w-3xl text-center">
        <p className="heading-micro mb-3">A HELPING HAND</p>
        <h2 className="heading-primary">Little details, beautifully held</h2>
        <div className="heading-copy mx-auto mt-4 grid max-w-[660px] gap-4">
          <p>
            Only pop your name down if something genuinely feels easy. No pressure at all &mdash; this just helps us know who&rsquo;s comfortable being asked.
          </p>
        </div>
      </div>

      <SoftCard className="mx-auto max-w-3xl">
        {hasLoadedResponse && !showForm && savedResponse && (
          <div className="grid gap-5">
            <div className="rounded-[1.2rem] border border-[#eaded6]/70 bg-white/42 p-4" aria-live="polite">
              <p className="type-card-body break-words text-[#3f302b]">
                Thank you &mdash; that means so much. We&rsquo;ll only reach out if it feels genuinely helpful.
              </p>
              <p className="type-card-body mt-3 break-words text-[#6f615c]">
                <span className="font-semibold text-[#8f6a63]">Name:</span> {savedResponse.name}
              </p>
              <p className="type-card-body mt-2 break-words text-[#6f615c]">
                <span className="font-semibold text-[#8f6a63]">Happy to help with:</span>{" "}
                {savedResponse.helpWith.join(", ")}
              </p>
              {savedResponse.note && (
                <p className="type-card-body mt-2 whitespace-pre-line break-words text-[#6f615c]">
                  <span className="font-semibold text-[#8f6a63]">Note:</span> {savedResponse.note}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setDraftResponse(savedResponse);
                setIsEditing(true);
              }}
              className="w-fit text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#8f6a63] underline decoration-[#d8bdb6] decoration-1 underline-offset-4 transition hover:text-[#6f5750] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#cbb6af]/70"
            >
              Update response
            </button>
          </div>
        )}

        {hasLoadedResponse && showForm && (
          <form className="grid gap-5" onSubmit={handleHelpingHandSave}>
            <label className="grid gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#8c7a72]" htmlFor="helping-hand-name">
              Name
              <input
                id="helping-hand-name"
                value={draftResponse.name}
                onChange={(event) => {
                  setDraftResponse((currentResponse) => ({ ...currentResponse, name: event.target.value }));
                  setError("");
                }}
                className="min-h-11 min-w-0 rounded-2xl border border-[#eaded6] bg-[#fffaf7]/86 px-4 font-serif text-[1rem] normal-case tracking-normal text-[#4f4641] shadow-[inset_0_0_0_1px_rgba(255,248,244,0.5)] outline-none transition placeholder:text-[#aa9991] focus:border-[#cbb6af] focus:ring-2 focus:ring-[#e8cfc8]/45"
                placeholder="Your name"
                autoComplete="name"
                required
              />
            </label>

            <fieldset className="grid gap-3">
              <legend className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#8c7a72]">
                I&rsquo;d be happy to help with:
              </legend>
              <div className="flex flex-wrap gap-2">
                {helpingHandOptions.map((option) => {
                  const isSelected = selectedOptions.includes(option);

                  return (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => toggleHelpOption(option)}
                      className={`min-h-11 rounded-full border px-4 py-2 text-left text-[0.76rem] font-semibold uppercase tracking-[0.1em] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#cbb6af]/70 ${
                        isSelected
                          ? "border-[#c9aaa0] bg-[#f4e4df] text-[#6f5750] shadow-[0_10px_22px_rgba(90,65,50,0.055)]"
                          : "border-[#eaded6] bg-white/58 text-[#8c7a72] hover:border-[#d9c5bc] hover:bg-white/78"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <label className="grid gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#8c7a72]" htmlFor="helping-hand-note">
              Anything we should know?
              <textarea
                id="helping-hand-note"
                value={draftResponse.note}
                onChange={(event) => setDraftResponse((currentResponse) => ({ ...currentResponse, note: event.target.value }))}
                className="min-h-24 min-w-0 resize-none rounded-2xl border border-[#eaded6] bg-[#fffaf7]/86 px-4 py-3 font-serif text-[1rem] normal-case tracking-normal text-[#4f4641] shadow-[inset_0_0_0_1px_rgba(255,248,244,0.5)] outline-none transition placeholder:text-[#aa9991] focus:border-[#cbb6af] focus:ring-2 focus:ring-[#e8cfc8]/45"
                placeholder="Optional note"
              />
            </label>

            {error && (
              <p className="type-caption text-[#8f6a63]" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-fit rounded-full border border-[#d9c5bc] bg-[#fff8f4]/78 px-5 py-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#8f6a63] shadow-[0_10px_24px_rgba(90,65,50,0.045)] transition hover:border-[#cbb6af] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#cbb6af]/70 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "I&rsquo;m happy to help"}
            </button>
          </form>
        )}
      </SoftCard>
    </PrivateSection>
  );
}

function LookbookGuideCard({
  guide,
  onOpen,
}: {
  guide: NonNullable<LookbookCategory["guide"]>;
  onOpen: () => void;
}) {
  const previewNotes = guide.notes.slice(0, 6);
  const hiddenNoteCount = guide.notes.length - previewNotes.length;
  const hasPoster = Boolean(guide.poster);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="inner-lookbook-guide-card group relative overflow-hidden rounded-[1.75rem] border border-[#eaded6] bg-[#fffaf7] p-6 text-left shadow-[0_18px_40px_rgba(90,65,50,0.075)] transition duration-500 hover:-translate-y-1 sm:col-span-2"
    >
      <span className="relative block">
        <span className="heading-micro block">{guide.eyebrow}</span>
        <span className="mt-3 block font-serif text-[2.35rem] leading-none text-[#8f6a63] md:text-[3rem]">
          {guide.title}
        </span>
        <span className="type-card-body mt-4 block max-w-2xl md:text-[1.08rem]">
          {guide.intro}
        </span>

        <span className="mt-5 inline-flex rounded-full border border-[#dccbc3] bg-white/58 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8f6a63] transition group-hover:border-[#c9aaa0] sm:hidden">
          Open full guide{!hasPoster && hiddenNoteCount > 0 ? ` + ${hiddenNoteCount} more` : ""}
        </span>

        {guide.poster ? (
          <span className="mt-6 block overflow-hidden rounded-[1.35rem] border border-[#eaded6]/82 bg-[#fffaf7]/82 p-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.55)]">
            <span className="relative block aspect-[2/3] overflow-hidden rounded-[1rem] bg-[#fbf3ef]">
              <Image
                src={guide.poster.src}
                alt={guide.poster.alt}
                fill
                sizes="(max-width: 768px) 100vw, 42vw"
                className="object-contain"
              />
            </span>
          </span>
        ) : (
          <span className="mt-6 grid gap-3 sm:grid-cols-2">
            {previewNotes.map((note) => (
              <span key={note.title} className="rounded-2xl border border-[#eaded6]/78 bg-white/58 p-4">
                <span className="heading-micro block text-[9px]">{note.title}</span>
                <span className="type-card-body mt-2 block">{note.copy}</span>
              </span>
            ))}
          </span>
        )}

        <span className="mt-6 inline-flex rounded-full border border-[#dccbc3] bg-white/58 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8f6a63] transition group-hover:border-[#c9aaa0]">
          Open full guide{!hasPoster && hiddenNoteCount > 0 ? ` + ${hiddenNoteCount} more` : ""}
        </span>
      </span>
    </button>
  );
}

function LookbookMoodboard() {
  const [activeLookbookId, setActiveLookbookId] = useState(lookbooks[0].id);
  const [selectedImage, setSelectedImage] = useState<{
    image: LookbookCategory["images"][number];
    category: string;
  } | null>(null);
  const [selectedGuide, setSelectedGuide] = useState<{
    guide: NonNullable<LookbookCategory["guide"]>;
    category: string;
  } | null>(null);
  const activeLookbook = lookbooks.find((lookbook) => lookbook.id === activeLookbookId) ?? lookbooks[0];
  const activeGuide = activeLookbook.guide;
  const [featureImage, ...supportingImages] = activeLookbook.images;
  const hasLookbookMedia = Boolean(activeGuide || featureImage || supportingImages.length > 0);

  return (
    <>
      <PrivateSection id="lookbooks" contentClassName="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="STYLE NOTES"
          title="Lookbooks"
          copy="These are soft references, not strict rules &mdash; they&rsquo;re here to help everyone understand the mood, colours, and level of formality."
        />

        <div className="inner-lookbook-tabs mx-auto mb-8 flex max-w-4xl flex-wrap justify-center gap-2 rounded-[2rem] border border-[#eaded6] bg-[#fffaf7]/78 p-2 shadow-[0_12px_34px_rgba(90,65,50,0.045)]">
          {lookbooks.map((lookbook) => (
            <button
              key={lookbook.id}
              type="button"
              onClick={() => setActiveLookbookId(lookbook.id)}
              className={`inner-lookbook-tab min-h-10 rounded-full px-4 text-[11px] font-semibold uppercase tracking-[0.12em] transition ${
                activeLookbook.id === lookbook.id
                  ? "bg-[var(--color-navy)] text-[var(--color-cta-text)] shadow-[0_10px_24px_rgba(28,34,56,0.16)]"
                  : "text-[#7d6b62] hover:bg-white/78 hover:text-[#8f6a63]"
              }`}
            >
              {lookbook.label}
            </button>
          ))}
        </div>

        <div className={hasLookbookMedia ? "grid gap-6 lg:grid-cols-[0.88fr_1.12fr]" : "mx-auto max-w-3xl"}>
          <SoftCard className="lg:sticky lg:top-6">
            <p className="heading-micro mb-3">{activeLookbook.label}</p>
            <h3 className="heading-secondary">Style brief</h3>
            {activeLookbook.brief && <p className="type-card-body mt-4">{activeLookbook.brief}</p>}

            {activeLookbook.palette.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {activeLookbook.palette.map((tone) => (
                  <span key={tone.name} className="inline-flex items-center gap-2 rounded-full border border-[#eaded6] bg-white/68 py-1.5 pl-2 pr-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#75675f]">
                    <span className="h-4 w-4 rounded-full border border-[#e3d1c9]" style={{ backgroundColor: tone.hex }} />
                    {tone.name}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-7 grid gap-4">
              <div>
                <p className="heading-micro mb-2">We love</p>
                <p className="type-card-body">{activeLookbook.weLove}</p>
              </div>
              <div>
                <p className="heading-micro mb-2">Please avoid</p>
                <p className="type-card-body">{activeLookbook.avoid}</p>
              </div>
              <div>
                <p className="heading-micro mb-2">Comfort notes</p>
                <p className="type-card-body">{activeLookbook.comfort}</p>
              </div>
            </div>
          </SoftCard>

          {hasLookbookMedia && (
            <div className="grid gap-4 sm:grid-cols-2">
              {activeGuide && (
                <LookbookGuideCard
                  guide={activeGuide}
                  onOpen={() => setSelectedGuide({ guide: activeGuide, category: activeLookbook.label })}
                />
              )}

              {featureImage && (
                <button
                  type="button"
                  onClick={() => setSelectedImage({ image: featureImage, category: activeLookbook.label })}
                  className="inner-lookbook-media-card group relative min-h-[28rem] overflow-hidden rounded-[1.75rem] border border-[#eaded6] bg-[#fffaf7] text-left shadow-[0_18px_40px_rgba(90,65,50,0.08)] transition duration-500 hover:-translate-y-1 sm:col-span-2"
                >
                  <Image
                    src={featureImage.src}
                    alt={featureImage.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 58vw"
                    className="object-cover transition duration-700 group-hover:scale-[1.035]"
                  />
                  <span className="absolute inset-0 bg-[linear-gradient(to_top,rgba(62,49,45,0.34),rgba(62,49,45,0.06)_48%,transparent)]" />
                  <span className="absolute bottom-0 left-0 right-0 p-5 text-[#fff8f4]">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-85">Feature image</span>
                    <span className="mt-2 block font-serif text-3xl leading-tight">{featureImage.title}</span>
                    <span className="type-caption mt-2 block max-w-xl text-[#fff8f4]/90">{featureImage.caption}</span>
                  </span>
                </button>
              )}

              {supportingImages.map((image) => (
                <button
                  key={image.title}
                  type="button"
                  onClick={() => setSelectedImage({ image, category: activeLookbook.label })}
                  className="inner-lookbook-support-card group overflow-hidden rounded-[1.35rem] border border-[#eaded6] bg-[#fffaf7]/82 text-left shadow-[0_12px_30px_rgba(90,65,50,0.055)] transition duration-500 hover:-translate-y-1"
                >
                  <span className="relative block aspect-[4/3] overflow-hidden">
                    <Image
                      src={image.src}
                      alt={image.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 28vw"
                      className="object-cover transition duration-700 group-hover:scale-[1.05]"
                    />
                  </span>
                  <span className="block p-4">
                    <span className="font-serif text-xl text-[#3f302b]">{image.title}</span>
                    <span className="type-card-body mt-2 block">{image.caption}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </PrivateSection>

      {selectedGuide && (
        <div className="inner-lookbook-backdrop fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`${selectedGuide.guide.title} guide`}>
          <button
            type="button"
            aria-label="Close lookbook guide"
            className="absolute inset-0 cursor-default"
            onClick={() => setSelectedGuide(null)}
          />
          <div className="inner-lookbook-modal relative max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-[2rem] border border-[#eaded6] bg-[#fffaf7] shadow-[0_28px_80px_rgba(40,30,26,0.3)]">
            <button
              type="button"
              onClick={() => setSelectedGuide(null)}
              className="inner-lookbook-close absolute right-4 top-4 z-10 rounded-full border border-[#eaded6] bg-[#fffaf7]/88 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3f302b] transition hover:border-[var(--color-divider)]"
            >
              Close
            </button>
            <div className={`grid max-h-[92vh] overflow-y-auto ${selectedGuide.guide.poster ? "lg:grid-cols-[0.9fr_1.1fr]" : ""}`}>
              {selectedGuide.guide.poster && (
                <div className="border-b border-[#eaded6] bg-[#fbf3ef]/74 p-4 lg:border-b-0 lg:border-r lg:p-5">
                  <div className="inner-lookbook-modal-media relative mx-auto aspect-[2/3] w-full max-w-[24rem] overflow-hidden rounded-[1.35rem] border border-[#eaded6] bg-[#fffaf7] shadow-[0_16px_36px_rgba(90,65,50,0.09)]">
                    <Image
                      src={selectedGuide.guide.poster.src}
                      alt={selectedGuide.guide.poster.alt}
                      fill
                      sizes="(max-width: 1024px) 92vw, 36vw"
                      className="object-contain"
                    />
                  </div>
                </div>
              )}
              <div className="p-6 md:p-10">
                <p className="heading-micro mb-3">{selectedGuide.category}</p>
                <h3 className="heading-primary">{selectedGuide.guide.title}</h3>
                <p className="luxe-serif-detail mt-5 max-w-2xl text-[1.25rem]">{selectedGuide.guide.intro}</p>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {selectedGuide.guide.notes.map((note) => (
                    <div key={note.title} className="inner-lookbook-note-card rounded-2xl border border-[#eaded6] bg-white/62 p-5">
                      <p className="heading-micro mb-2">{note.title}</p>
                      <p className="type-card-body">{note.copy}</p>
                    </div>
                  ))}
                </div>
                <p className="inner-lookbook-note-card type-card-body mt-8 rounded-2xl border border-[#eaded6] bg-[#fbf3ef]/74 p-5">
                  {selectedGuide.guide.footer}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedImage && (
        <div className="inner-lookbook-backdrop fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`${selectedImage.image.title} lookbook image`}>
          <button
            type="button"
            aria-label="Close lookbook image"
            className="absolute inset-0 cursor-default"
            onClick={() => setSelectedImage(null)}
          />
          <div className="inner-lookbook-modal relative max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-[#eaded6] bg-[#fffaf7] shadow-[0_28px_80px_rgba(40,30,26,0.3)]">
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="inner-lookbook-close absolute right-4 top-4 z-10 rounded-full border border-[#eaded6] bg-[#fffaf7]/88 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3f302b] transition hover:border-[var(--color-divider)]"
            >
              Close
            </button>
            <div className="grid max-h-[92vh] overflow-y-auto lg:grid-cols-[1.25fr_0.75fr]">
              <div className="relative min-h-[22rem] lg:min-h-[42rem]">
                <Image
                  src={selectedImage.image.src}
                  alt={selectedImage.image.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  className="object-cover"
                />
              </div>
              <div className="p-6 md:p-8">
                <p className="heading-micro mb-3">{selectedImage.category}</p>
                <h3 className="heading-secondary">{selectedImage.image.title}</h3>
                <p className="type-card-body mt-5">{selectedImage.image.caption}</p>
                <div className="mt-7 rounded-2xl border border-[#eaded6] bg-white/62 p-5">
                  <p className="heading-micro mb-2">Why we love it</p>
                  <p className="type-card-body">{selectedImage.image.why}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function InnerCircleContent() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [roleHelpers, setRoleHelpers] = useState<RoleHelperMap>({});
  const [roleHelperDrafts, setRoleHelperDrafts] = useState<RoleHelperMap>(() => createRoleHelperDrafts());
  const [editingRoleIds, setEditingRoleIds] = useState<Record<string, boolean>>({});
  const [roleHelperErrors, setRoleHelperErrors] = useState<Record<string, string>>({});
  const [hasLoadedRoleHelpers, setHasLoadedRoleHelpers] = useState(false);
  const heroReveal = (delay = 0, y = 16) => ({
    initial: shouldReduceMotion ? false : { opacity: 0, y },
    animate: { opacity: 1, y: 0 },
    transition: { duration: shouldReduceMotion ? 0 : 0.92, delay: shouldReduceMotion ? 0 : delay, ease: innerRevealEase },
  });

  const handleLogout = async () => {
    await fetch("/api/inner-circle/logout", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
    }).catch(() => null);
    router.refresh();
  };

  useEffect(() => {
    document.documentElement.classList.add("inner-circle-editorial-scroll");

    return () => {
      document.documentElement.classList.remove("inner-circle-editorial-scroll");
    };
  }, []);

  useEffect(() => {
    const loadStoredHelpers = window.setTimeout(() => {
      const storedHelpers = readStoredRoleHelpers();
      setRoleHelpers(storedHelpers);
      setRoleHelperDrafts(createRoleHelperDrafts(storedHelpers));
      setHasLoadedRoleHelpers(true);
    }, 0);

    return () => {
      window.clearTimeout(loadStoredHelpers);
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedRoleHelpers) {
      return;
    }

    window.localStorage.setItem(WEDDING_DAY_ROLES_HELPERS_KEY, JSON.stringify(roleHelpers));
  }, [hasLoadedRoleHelpers, roleHelpers]);

  const handleRoleHelperDraftChange = (roleId: string, field: keyof RoleHelperNames, value: string) => {
    setRoleHelperDrafts((currentDrafts) => ({
      ...currentDrafts,
      [roleId]: {
        ...(currentDrafts[roleId] ?? emptyRoleHelperNames()),
        [field]: value,
      },
    }));
    setRoleHelperErrors((currentErrors) => {
      if (!currentErrors[roleId]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[roleId];
      return nextErrors;
    });
  };

  const handleRoleHelperSave = (roleId: string) => {
    const draft = roleHelperDrafts[roleId] ?? emptyRoleHelperNames();
    const nextNames = {
      name1: draft.name1.trim(),
      name2: draft.name2.trim(),
    };

    if (!nextNames.name1 && !nextNames.name2) {
      setRoleHelperErrors((currentErrors) => ({
        ...currentErrors,
        [roleId]: "Add your name if this feels easy for you.",
      }));
      return;
    }

    setRoleHelpers((currentHelpers) => ({
      ...currentHelpers,
      [roleId]: nextNames,
    }));
    setRoleHelperDrafts((currentDrafts) => ({
      ...currentDrafts,
      [roleId]: nextNames,
    }));
    setEditingRoleIds((currentEditingRoleIds) => ({
      ...currentEditingRoleIds,
      [roleId]: false,
    }));
    setRoleHelperErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[roleId];
      return nextErrors;
    });
  };

  const handleRoleHelperEdit = (roleId: string) => {
    setRoleHelperDrafts((currentDrafts) => ({
      ...currentDrafts,
      [roleId]: roleHelpers[roleId] ?? currentDrafts[roleId] ?? emptyRoleHelperNames(),
    }));
    setEditingRoleIds({ [roleId]: true });
  };

  return (
    <main className="inner-circle-page min-h-screen bg-[#fbf7f2] text-[#4f4641]">
      <section className="inner-circle-hero inner-editorial-panel relative isolate overflow-hidden px-6 pb-16 pt-20 text-center md:pb-20 md:pt-28">
        <div className="mx-auto max-w-4xl">
          <motion.p className="heading-micro mb-5" {...heroReveal(0, 10)}>
            INNER CIRCLE
          </motion.p>
          <motion.h1 className="heading-primary" {...heroReveal(0.14, 16)}>
            Inner Circle
          </motion.h1>
          <motion.p className="luxe-serif-detail mx-auto mt-8 max-w-2xl text-[1.35rem] md:text-[1.65rem]" {...heroReveal(0.28, 14)}>
            A little private space for the people closest to us.
          </motion.p>
          <motion.p className="heading-copy mx-auto mt-6 max-w-2xl" {...heroReveal(0.4, 12)}>
            This page is here to keep everything gentle, easy, and in one place &mdash; dates, style notes, dress-trial moments, wedding-week reminders, and the little details our favourite people may need along the way.
          </motion.p>
          <motion.p className="type-card-body mx-auto mt-5 max-w-xl text-[#8c7a72]" {...heroReveal(0.48, 10)}>
            Nothing here is meant to feel like homework. It is just a calm place to check back whenever you need.
          </motion.p>
        </div>
        <motion.nav aria-label="Inner Circle sections" className="mx-auto mt-8 flex max-w-[23rem] flex-wrap justify-center gap-2 sm:mt-10 sm:max-w-4xl" {...heroReveal(0.58, 10)}>
          {pageAnchors.map((anchor) => (
            <a
              key={anchor.href}
              href={anchor.href}
              className="min-h-10 rounded-full border border-[#eaded6] bg-[#fffaf7]/76 px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8c7a72] shadow-[0_8px_20px_rgba(90,65,50,0.04)] transition hover:border-[var(--color-divider)] hover:text-[#8f6a63] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#cbb6af]/70 sm:px-4"
            >
              {anchor.label}
            </a>
          ))}
        </motion.nav>
        <motion.button
          type="button"
          onClick={handleLogout}
          className="mt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9a8780] underline decoration-[#d8bdb6]/70 decoration-1 underline-offset-4 transition hover:text-[#8f6a63] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#cbb6af]/70"
          {...heroReveal(0.66, 8)}
        >
          Leave private page
        </motion.button>
      </section>

      <LatestUpdatesCard />

      <PrivateSection id="note" className="pt-10 md:pt-14" contentClassName="mx-auto max-w-[780px] text-center">
        <p className="heading-micro mb-4">A NOTE FROM US</p>
        <h2 className="heading-primary">A note from us</h2>
        <div className="luxe-serif-detail mt-7 space-y-5 text-[1.2rem] md:text-[1.45rem]">
          <p>
            We&rsquo;re so grateful to have you beside us in this season. This little space is for the people closest to us &mdash; the ones who have made the lead-up feel lighter, warmer, and more full of love.
          </p>
          <p>
            We want the wedding day to feel beautiful, calm, and full of joy. Everything here is simply meant to keep the details easy to find, so you can feel prepared without having to dig through messages.
          </p>
          <p>
            Thank you for being in our inner circle. It means more than we can say.
          </p>
        </div>
      </PrivateSection>

      <PrivateSection id="details">
        <SectionHeading eyebrow="KEY DETAILS" title="The essentials" copy="The simple anchor points everyone can keep in mind." />
        <div className="grid gap-4 md:grid-cols-2">
          {keyDetails.map((detail) => (
            <SoftCard key={detail.label} className={detail.label === "Main priority" || detail.label === "Privacy note" ? "md:col-span-2" : ""}>
              <p className="heading-micro mb-3">{detail.label}</p>
              <p className="luxe-serif-detail text-[1.35rem] leading-snug text-[#3f302b]">{detail.value}</p>
            </SoftCard>
          ))}
        </div>
      </PrivateSection>

      <DressDiarySection />

      <LookbookMoodboard />

      <PrivateSection id="dates" contentClassName="mx-auto grid max-w-5xl items-start gap-6 md:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="heading-micro mb-3">KEY DATES</p>
          <h2 className="heading-primary">Dates to hold</h2>
          <p className="heading-copy mt-5">
            A few anchor dates to keep in mind. The finer timings will be confirmed closer to the day.
          </p>
        </div>
        <SoftCard>
          <div className="space-y-5">
            {keyDates.map((item) => (
              <div key={item.date} className="grid gap-2 border-b border-[#eaded6] pb-5 last:border-b-0 last:pb-0 sm:grid-cols-[10rem_1fr]">
                <p className="heading-micro">{item.date}</p>
                <p className="type-card-body text-[#3f302b]">{item.title}</p>
              </div>
            ))}
          </div>
        </SoftCard>
      </PrivateSection>

      <UpcomingBridalPartyDatesSection />

      <PrivateSection id="week">
        <SectionHeading title="A calm week before" copy="A few gentle reminders so the week feels easy, calm, and unhurried." />
        <SoftCard>
          <div className="grid gap-4 sm:grid-cols-2">
            {weekReminders.map((item) => (
              <div key={item} className="type-card-body flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#b98278]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </SoftCard>
      </PrivateSection>

      <PrivateSection id="roles">
        <SectionHeading
          eyebrow="WEDDING DAY SUPPORT"
          title="Little ways to help"
          copy="These are not assignments &mdash; just a few small moments where we may ask for a hand closer to the day. If something feels easy for you, you&rsquo;re welcome to let us know. No pressure at all."
        />
        <div className="grid gap-5 md:grid-cols-2">
          {dayRoles.map((role) => (
            <SoftCard key={role.id} className="flex min-w-0 flex-col">
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-10 bg-[var(--color-divider)]" />
                <span className="h-2 w-2 rotate-45 bg-[#cbb6af]" />
              </div>
              <h3 className="type-card-title">{role.title}</h3>
              <p className="type-card-body mt-4">{role.copy}</p>
              <div className="mt-auto">
                <RoleHelperSignup
                  role={role}
                  savedNames={roleHelpers[role.id]}
                  draftNames={roleHelperDrafts[role.id] ?? emptyRoleHelperNames()}
                  error={roleHelperErrors[role.id]}
                  isEditing={Boolean(editingRoleIds[role.id])}
                  onChange={handleRoleHelperDraftChange}
                  onEdit={handleRoleHelperEdit}
                  onSave={handleRoleHelperSave}
                />
              </div>
            </SoftCard>
          ))}
        </div>
      </PrivateSection>

      <HelpingHandSection />

      <PrivateSection id="contact" contentClassName="mx-auto grid max-w-5xl items-start gap-6 md:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="heading-micro mb-3">WHO TO CONTACT</p>
          <h2 className="heading-primary">Who to ask</h2>
          <p className="heading-copy mt-5">
            Closer to the wedding, we&rsquo;ll add the best person to contact for different things so the day stays calm and we can stay present.
          </p>
          <p className="type-card-body mt-4 text-[#8c7a72]">
            No phone numbers are listed here yet. We&rsquo;ll only add contact details once this page is ready to be shared privately.
          </p>
        </div>
        <SoftCard>
          <div className="space-y-4">
            {contactPlaceholders.map((item) => (
              <div key={item} className="rounded-2xl border border-[#eaded6] bg-white/52 px-4 py-3 font-serif text-[1rem] leading-6 tracking-[0.01em] text-[#4f4641]">
                {item}
              </div>
            ))}
          </div>
        </SoftCard>
      </PrivateSection>

      <PrivateSection className="pb-24 md:pb-28" contentClassName="mx-auto max-w-3xl">
        <SoftCard className="text-center">
          <p className="heading-micro mb-3">FINAL NOTE</p>
          <h2 className="heading-secondary">Thank you for being part of our inner circle</h2>
          <div className="type-card-body mx-auto mt-5 max-w-2xl space-y-4">
            <p>
              We don&rsquo;t expect perfection from anyone. We just want the day to feel full of love, calm energy, good food, beautiful moments, and the people who matter most to us.
            </p>
            <p>We love you, and we&rsquo;re so lucky to have you with us.</p>
          </div>
        </SoftCard>
      </PrivateSection>
    </main>
  );
}

export default InnerCircleContent;
