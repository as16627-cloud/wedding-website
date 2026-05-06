"use client";

import { type FormEvent, type ReactNode, useState, useSyncExternalStore } from "react";

const INNER_CIRCLE_PASSWORD = "garden2026";
const INNER_CIRCLE_ACCESS_KEY = "inner-circle-access";
const INNER_CIRCLE_ACCESS_EVENT = "inner-circle-access-change";

const pageAnchors = [
  { href: "#note", label: "Note" },
  { href: "#details", label: "Details" },
  { href: "#dates", label: "Dates" },
  { href: "#week", label: "Wedding week" },
  { href: "#roles", label: "Roles" },
  { href: "#style", label: "Style" },
  { href: "#contact", label: "Contact" },
];

const keyDetails = [
  { label: "Wedding date", value: "Sunday, 1 November 2026" },
  { label: "Venue", value: "Caversham House, Swan Valley" },
  { label: "Ceremony", value: "4:00 PM at Garden House" },
  { label: "Style", value: "Elegant garden romance, pastel formal" },
  { label: "Main priority", value: "Be present, enjoy the day, and help keep the energy calm and happy." },
];

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
  "Help keep the week as calm as possible.",
];

const dayRoles = [
  {
    title: "Timeline lead",
    copy: "Keeps an eye on the day's flow and helps point people in the right direction.",
  },
  {
    title: "MC",
    copy: "Helps guide guests through speeches, dinner, cake cutting, first dance, and key transitions.",
  },
  {
    title: "Family photo wrangler",
    copy: "Helps gather family members quickly after the ceremony so photos don't take forever.",
  },
  {
    title: "Confetti lead",
    copy: "Makes sure confetti is handed out and ready for the ceremony exit.",
  },
  {
    title: "Touch-up kit keeper",
    copy: "Keeps lipstick, tissues, blotting paper, perfume, pins, and small beauty items nearby.",
  },
  {
    title: "Emergency kit keeper",
    copy: "Keeps safety pins, plasters, pain relief, stain remover, fashion tape, sewing kit, and other just-in-case items.",
  },
  {
    title: "Gift/card collector",
    copy: "Makes sure cards and gifts are collected and kept safe at the end of the night.",
  },
  {
    title: "Transport helper",
    copy: "Helps confirm the right people are in the right cars at the right time.",
  },
];

const preferredTones = [
  "Blush",
  "Champagne",
  "Soft sage",
  "Powder blue",
  "Dusty lavender",
  "Nude",
  "Beige",
  "Navy",
  "Charcoal",
  "Classic black",
];

const littleWaysToHelp = [
  "Help keep the morning calm.",
  "Take behind-the-scenes photos and videos.",
  "Remind us to drink water and eat.",
  "Help gather people for photos.",
  "Keep an eye on cards, gifts, and personal items.",
  "Help guests find where they need to go.",
  "Keep the dance floor energy alive.",
  "Most importantly, enjoy the day with us.",
];

const contactPlaceholders = [
  "General questions - TBC",
  "Wedding-day logistics - TBC",
  "Family photos - TBC",
  "Transport - TBC",
  "Emergency / urgent - TBC",
];

function getInnerCircleAccessSnapshot() {
  if (typeof window === "undefined") {
    return false;
  }

  return sessionStorage.getItem(INNER_CIRCLE_ACCESS_KEY) === "true";
}

function subscribeToInnerCircleAccess(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(INNER_CIRCLE_ACCESS_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(INNER_CIRCLE_ACCESS_EVENT, onStoreChange);
  };
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
    <section id={id} className={`relative scroll-mt-8 overflow-hidden bg-[#fbf7f2] px-6 py-16 md:py-20 ${className}`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#fbf7f2] to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_22%,_rgba(232,174,168,0.10),_transparent_32%),radial-gradient(circle_at_84%_72%,_rgba(218,192,138,0.10),_transparent_34%)]" />
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
  return (
    <div className="mx-auto mb-10 max-w-3xl text-center">
      {eyebrow && <p className="heading-micro mb-3">{eyebrow}</p>}
      <h2 className="heading-primary">{title}</h2>
      {copy && <p className="heading-copy mx-auto mt-4 max-w-[620px] text-[16px]">{copy}</p>}
    </div>
  );
}

function SoftCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[1.75rem] border border-[#eaded6] bg-[#fffaf7]/82 p-6 text-[#4f4641] shadow-[0_14px_38px_rgba(90,65,50,0.055)] backdrop-blur ${className}`}
    >
      {children}
    </div>
  );
}

function InnerCircleContent() {
  return (
    <main className="min-h-screen bg-[#fbf7f2] text-[#4f4641]">
      <section className="relative isolate overflow-hidden px-6 pb-16 pt-20 text-center md:pb-20 md:pt-28">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_20%,_rgba(185,130,120,0.13),_transparent_34%),radial-gradient(circle_at_18%_70%,_rgba(203,185,163,0.18),_transparent_30%),radial-gradient(circle_at_86%_68%,_rgba(143,154,125,0.10),_transparent_28%)]" />
        <div className="mx-auto max-w-4xl">
          <p className="heading-micro mb-5">INNER CIRCLE</p>
          <h1 className="heading-primary">Inner Circle</h1>
          <p className="luxe-serif-detail mx-auto mt-8 max-w-2xl text-[1.35rem] md:text-[1.65rem]">
            A little space for the people helping us bring the day to life.
          </p>
          <p className="heading-copy mx-auto mt-6 max-w-2xl">
            This page is here to keep everyone gently in the loop as we get closer to the wedding. We&rsquo;ll use it for key dates, wedding-week reminders, small jobs, and anything our favourite people need to know.
          </p>
        </div>
        <nav aria-label="Inner Circle sections" className="mx-auto mt-10 flex max-w-4xl flex-wrap justify-center gap-2">
          {pageAnchors.map((anchor) => (
            <a
              key={anchor.href}
              href={anchor.href}
              className="rounded-full border border-[#eaded6] bg-[#fffaf7]/76 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8c7a72] shadow-[0_8px_20px_rgba(90,65,50,0.04)] transition hover:border-[#d8bd96] hover:text-[#8f6a63]"
            >
              {anchor.label}
            </a>
          ))}
        </nav>
      </section>

      <PrivateSection id="note" className="pt-10 md:pt-14" contentClassName="mx-auto max-w-[780px] text-center">
        <p className="heading-micro mb-4">A NOTE FROM US</p>
        <h2 className="heading-primary">A note from us</h2>
        <div className="luxe-serif-detail mt-7 space-y-5 text-[1.2rem] md:text-[1.45rem]">
          <p>
            We are so grateful to have you beside us for this season. Whether you&rsquo;re standing with us, helping behind the scenes, travelling to be there, calming nerves, holding flowers, fixing outfits, making us laugh, or simply showing up with love &mdash; it means more than we can say.
          </p>
          <p>
            We want the wedding day to feel beautiful, calm, and full of joy. This page will help keep the important details in one place so no one has to dig through group chats.
          </p>
        </div>
      </PrivateSection>

      <PrivateSection id="details">
        <SectionHeading eyebrow="KEY DETAILS" title="The essentials" copy="The simple anchor points everyone can keep in mind." />
        <div className="grid gap-4 md:grid-cols-2">
          {keyDetails.map((detail) => (
            <SoftCard key={detail.label} className={detail.label === "Main priority" ? "md:col-span-2" : ""}>
              <p className="heading-micro mb-3">{detail.label}</p>
              <p className="luxe-serif-detail text-[1.35rem] leading-snug text-[#3f302b]">{detail.value}</p>
            </SoftCard>
          ))}
        </div>
      </PrivateSection>

      <PrivateSection id="dates" contentClassName="mx-auto grid max-w-5xl items-start gap-6 md:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="heading-micro mb-3">KEY DATES</p>
          <h2 className="heading-primary">Dates to hold</h2>
          <p className="heading-copy mt-5">
            Exact rehearsal, getting-ready, and family-photo timings will be confirmed closer to the date.
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

      <PrivateSection id="week">
        <SectionHeading title="Wedding week reminders" copy="Small practical things that will help the week feel calm and unhurried." />
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
          eyebrow="WEDDING DAY ROLES"
          title="Little jobs, gently held"
          copy="We&rsquo;ll confirm names closer to the day, but these are the kinds of roles we may ask for help with."
        />
        <div className="grid gap-5 md:grid-cols-2">
          {dayRoles.map((role) => (
            <SoftCard key={role.title}>
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-10 bg-[#d8bd96]" />
                <span className="h-2 w-2 rotate-45 bg-[#cbb6af]" />
              </div>
              <h3 className="type-card-title">{role.title}</h3>
              <p className="type-card-body mt-4">{role.copy}</p>
            </SoftCard>
          ))}
        </div>
      </PrivateSection>

      <PrivateSection id="style" contentClassName="mx-auto grid max-w-5xl items-start gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="heading-micro mb-3">DRESS AND STYLING</p>
          <h2 className="heading-primary">Soft, polished, garden-ready</h2>
          <div className="type-card-body mt-5 space-y-4">
            <p>For our inner circle, we&rsquo;d love outfits to feel soft, elegant, and cohesive with the garden setting.</p>
            <p>
              Overall feel: polished, romantic, timeless, and comfortable enough to move through the day.
            </p>
            <p>
              Please avoid anything too casual, overly bright neon tones, or anything that clashes with the soft garden palette.
            </p>
            <p className="text-[#8c7a72]">Specific bridal party outfit guidance will be confirmed separately.</p>
          </div>
        </div>
        <SoftCard>
          <p className="heading-micro mb-4">Preferred tones</p>
          <div className="flex flex-wrap gap-2">
            {preferredTones.map((tone) => (
              <span key={tone} className="rounded-full border border-[#eaded6] bg-white/68 px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#7d6b62]">
                {tone}
              </span>
            ))}
          </div>
        </SoftCard>
      </PrivateSection>

      <PrivateSection>
        <SectionHeading title="Little ways to help" copy="Nothing here needs to feel formal. These are simply the small things that make the day easier." />
        <div className="grid gap-4 md:grid-cols-2">
          {littleWaysToHelp.map((item) => (
            <SoftCard key={item} className="p-5">
              <p className="type-card-body flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#b98278]" />
                <span>{item}</span>
              </p>
            </SoftCard>
          ))}
        </div>
      </PrivateSection>

      <PrivateSection id="contact" contentClassName="mx-auto grid max-w-5xl items-start gap-6 md:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="heading-micro mb-3">WHO TO CONTACT</p>
          <h2 className="heading-primary">Who to ask</h2>
          <p className="heading-copy mt-5">
            Closer to the wedding, we&rsquo;ll add the best person to contact for different things so Sumaya and Adi aren&rsquo;t fielding every question on the day.
          </p>
          <p className="mt-4 text-sm leading-6 text-[#8c7a72]">
            No phone numbers are listed here yet. We&rsquo;ll only add real contact details when we are comfortable with how this page is being shared.
          </p>
        </div>
        <SoftCard>
          <div className="space-y-4">
            {contactPlaceholders.map((item) => (
              <div key={item} className="rounded-2xl border border-[#eaded6] bg-white/52 px-4 py-3 text-sm font-medium text-[#4f4641]">
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

export default function InnerCircleGate() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const unlocked = useSyncExternalStore(
    subscribeToInnerCircleAccess,
    getInnerCircleAccessSnapshot,
    () => false,
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.trim() === INNER_CIRCLE_PASSWORD) {
      sessionStorage.setItem(INNER_CIRCLE_ACCESS_KEY, "true");
      window.dispatchEvent(new Event(INNER_CIRCLE_ACCESS_EVENT));
      setError("");
      return;
    }

    setError("That password does not look quite right. Please try again.");
  }

  if (unlocked) {
    return <InnerCircleContent />;
  }

  return (
    <main className="min-h-screen bg-[#fbf7f2] px-6 py-16 text-[#4f4641]">
      <section className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-xl flex-col items-center justify-center text-center">
        <p className="heading-micro mb-5">Sumaya & Aditya</p>
        <h1 className="heading-primary">Inner Circle</h1>
        <p className="heading-copy mx-auto mt-6 max-w-lg">
          A private page for the bridal party and closest family. Please enter the passcode to continue.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-9 w-full rounded-[2rem] border border-[#eaded6] bg-[#fffaf7]/82 p-6 shadow-[0_18px_45px_rgba(90,65,50,0.07)] backdrop-blur md:p-8"
        >
          <label className="grid gap-3 text-left">
            <span className="type-section-eyebrow">Passcode</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="min-h-12 rounded-2xl border border-[#eaded6] bg-white/80 px-4 text-[#3f302b] outline-none transition duration-300 ease-out placeholder:text-[#a99790] focus:border-[#b98278]"
              placeholder="Enter passcode"
            />
          </label>

          {error && <p className="mt-4 text-left text-sm leading-6 text-[#9b6f68]">{error}</p>}

          <button
            type="submit"
            className="primary-cta type-button mt-6 w-full"
          >
            Enter
          </button>
        </form>
      </section>
    </main>
  );
}
