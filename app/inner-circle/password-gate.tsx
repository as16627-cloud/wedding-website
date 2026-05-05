"use client";

import { type FormEvent, type ReactNode, useState, useSyncExternalStore } from "react";

const INNER_CIRCLE_PASSWORD = "garden2026";
const INNER_CIRCLE_ACCESS_KEY = "inner-circle-access";
const INNER_CIRCLE_ACCESS_EVENT = "inner-circle-access-change";

const roles = [
  {
    title: "Bridesmaids",
    copy: "Arrive ready for the getting-ready shoot. Hair and makeup timing will be shared in advance. You'll carry bouquets during the ceremony and be part of our closest photo moments throughout the day.",
  },
  {
    title: "Groom's Party",
    copy: "Arrive dressed and ready for photos. Boutonnieres will be provided on arrival. We'll keep things relaxed - just be present and enjoy the moments with us.",
  },
  {
    title: "Groomslady",
    copy: "You'll be styled to complement the bridal party. A corsage will be provided. Your role is simply to stand beside us and be part of the day.",
  },
  {
    title: "Immediate Family",
    copy: "You'll be part of key photo moments and the ceremony flow. We'll guide you throughout, so there's nothing to worry about.",
  },
];

const photoFlow = [
  "Pre-ceremony portraits",
  "Ceremony",
  "Family and bridal party photos",
  "Golden hour couple portraits",
  "Reception entrance",
];

const bringItems = [
  "Comfortable shoes for garden walking",
  "Touch-up essentials",
  "Personal items for the day",
  "Any jewellery or accessories allocated to you",
  "A calm, present mindset",
];

const notes = [
  "The ceremony will take place within the gardens at Caversham House.",
  "Weather backup will be handled by the venue team if needed.",
  "Please keep phones tucked away during key ceremony moments.",
  "We'll share final timings closer to the day.",
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
}: {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section className={`relative overflow-hidden bg-[#fbf7f2] px-6 py-16 md:py-20 ${className}`}>
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
      <section className="relative isolate overflow-hidden px-6 pb-20 pt-20 text-center md:pb-24 md:pt-28">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_20%,_rgba(185,130,120,0.13),_transparent_34%),radial-gradient(circle_at_18%_70%,_rgba(203,185,163,0.18),_transparent_30%),radial-gradient(circle_at_86%_68%,_rgba(143,154,125,0.10),_transparent_28%)]" />
        <div className="mx-auto max-w-4xl">
          <p className="heading-micro mb-5">INNER CIRCLE</p>
          <h1 className="heading-primary">Our Closest People</h1>
          <p className="luxe-serif-detail mx-auto mt-8 max-w-2xl text-[1.35rem] md:text-[1.65rem]">
            You are not just guests on this day &mdash; you are part of it. This page holds everything you need to move
            through the day with us, calmly and beautifully.
          </p>
          <p className="type-section-eyebrow mt-8">
            Private page for our bridal party and closest family.
          </p>
        </div>
      </section>

      <PrivateSection className="pt-12 md:pt-16" contentClassName="mx-auto max-w-[760px] text-center">
        <p className="heading-micro mb-4">A NOTE FROM US</p>
        <h2 className="heading-primary">A Note From Us</h2>
        <div className="luxe-serif-detail mt-7 space-y-5 text-[1.35rem] md:text-[1.6rem]">
          <p>We couldn&rsquo;t imagine this day without you.</p>
          <p>
            Each of you holds a special place in our lives, and having you by our side means more than we can put into
            words. This page is here to make everything feel easy, clear, and beautifully organised &mdash; so you can
            simply enjoy the day with us.
          </p>
        </div>
      </PrivateSection>

      <PrivateSection>
        <SectionHeading eyebrow="YOUR ROLES" title="How You Are Part Of The Day" />
        <div className="grid gap-5 md:grid-cols-2">
          {roles.map((role) => (
            <SoftCard key={role.title}>
              <div className="mb-5 h-px w-12 bg-[#d8bd96]" />
              <h3 className="type-card-title">{role.title}</h3>
              <p className="type-card-body mt-4">{role.copy}</p>
            </SoftCard>
          ))}
        </div>
      </PrivateSection>

      <PrivateSection contentClassName="mx-auto grid max-w-5xl items-start gap-6 md:grid-cols-2">
        <SoftCard>
          <p className="heading-micro mb-3">TIMING</p>
          <h2 className="heading-secondary">Getting Ready &amp; Arrival</h2>
          <div className="type-card-body mt-5 space-y-4">
            <p>
              Please arrive at your designated location at your allocated time. We recommend allowing extra time to
              settle in before photos begin.
            </p>
            <p>Full timing will be shared closer to the day.</p>
          </div>
        </SoftCard>

        <SoftCard>
          <p className="heading-micro mb-3">FLOW</p>
          <h2 className="heading-secondary">Photos &amp; Flow</h2>
          <p className="type-card-body mt-5">
            We&rsquo;ll guide you through photos so everything feels natural and relaxed.
          </p>
          <div className="mt-6 space-y-3">
            {photoFlow.map((item) => (
              <div key={item} className="type-card-body flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-[#b98278]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <p className="type-card-body mt-6">
            No need to remember everything &mdash; just follow along and enjoy it.
          </p>
        </SoftCard>
      </PrivateSection>

      <PrivateSection>
        <SectionHeading title="What To Bring" copy="A few small things that will help the day feel easy and calm." />
        <SoftCard className="mx-auto max-w-3xl">
          <div className="grid gap-4 sm:grid-cols-2">
            {bringItems.map((item) => (
              <div key={item} className="type-card-body flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#b98278]" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </SoftCard>
      </PrivateSection>

      <PrivateSection>
        <SectionHeading title="A Few Notes" />
        <div className="grid gap-4 md:grid-cols-2">
          {notes.map((note) => (
            <SoftCard key={note} className="p-5">
              <p className="type-card-body">{note}</p>
            </SoftCard>
          ))}
        </div>
      </PrivateSection>

      <PrivateSection className="pb-24 md:pb-28" contentClassName="mx-auto max-w-3xl">
        <SoftCard className="text-center">
          <p className="heading-micro mb-3">ON THE DAY</p>
          <h2 className="heading-secondary">On the Day</h2>
          <p className="type-card-body mx-auto mt-5 max-w-2xl">
            If you need anything on the day, please contact the nominated point person. We&rsquo;ll share their details
            closer to the wedding so everything can run smoothly while we stay present.
          </p>
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
