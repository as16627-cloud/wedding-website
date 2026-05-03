"use client";

import React, { type FormEvent, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  CalendarPlus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flower2,
  Footprints,
  Mail,
  Music,
  Palette,
  Shirt,
  Utensils,
} from "lucide-react";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
};

type Faq = {
  question: string;
  answer: string;
};

type FadeInSectionProps = {
  children: ReactNode;
  className?: string;
};

type SoftSectionProps = {
  children: ReactNode;
  id?: string;
  className?: string;
  contentClassName?: string;
};

const googleCalendarUrl =
  "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Sumaya%20%26%20Aditya%E2%80%99s%20Wedding&dates=20261101T160000/20261101T230000&ctz=Australia%2FPerth&location=Caversham%20House%2C%20141%20Caversham%20Avenue%2C%20Caversham%20WA%206055%2C%20Australia&details=We%20can%E2%80%99t%20wait%20to%20celebrate%20with%20you.%20Ceremony%20begins%20at%204%3A00%20PM%20at%20Garden%20House%2C%20followed%20by%20reception%20at%20Main%20House";

const venueImages = [
  { src: "/images/venue.jpg", alt: "Caversham House Gardens" },
  { src: "/images/venue2.jpg", alt: "Caversham House Main Building" },
  { src: "/images/venue3.png", alt: "Caversham House garden lawn and gazebo" },
];

const venueAutoPlayDelay = 5000;
const venueManualPauseDelay = 6000;
const venueSwipeThreshold = 40;

const itinerary = [
  {
    time: "3:00 PM",
    title: "Guests Arrival",
    detail: "Arrive early, find your seat, and enjoy the gardens before the ceremony begins.",
  },
  {
    time: "3:45 PM",
    title: "Guests Seated",
    detail: "We kindly ask guests to be seated before the ceremony begins.",
  },
  {
    time: "4:00 PM",
    title: "Ceremony",
    detail: "Our ceremony will take place at the Garden House, Caversham House.",
  },
  {
    time: "4:30 PM",
    title: "Drinks & Photos",
    detail: "Wedding party photos, mingling, and pre-dinner canapes and drinks",
  },
  {
    time: "6:30 PM",
    title: "Reception Dinner",
    detail: "A sit-down dinner reception at the Main House at Caverhsham House.",
  },
  {
    time: "8:30 PM",
    title: "Dancing & Celebration",
    detail: "Music, drinks, and dancing into the evening.",
  },
  {
    time: "11:00 PM",
    title: "Farewell",
    detail: "The formal celebration comes to a close.",
  },
];

const dressCode = {
  eyebrow: "DRESS CODE",
  title: "Romantic Garden Formal",
  intro:
    "For the day, we invite you to dress in soft, elegant tones inspired by the gardens of Caversham House. Pastels, blush, champagne, sage, dusty blue, lavender, soft pinks, and refined neutrals will sit beautifully with the setting.",
  details:
    "We encourage polished garden formal attire - cocktail dresses, midi or full-length silhouettes, sarees, lehengas, tailored suits, dress shirts, and elevated formalwear are all welcome.",
  note: "We kindly ask guests to avoid white, ivory, cream, or anything bridal in tone.",
  shoeNote:
    "The ceremony will take place within the venue gardens, so we recommend shoes that are comfortable on lawns and garden paths.",
  cards: [
    {
      title: "Palette",
      text: "Soft pastels, blush, champagne, sage, dusty blue, lavender, soft pinks, and warm neutrals.",
    },
    {
      title: "Style",
      text: "Garden formal, cocktail, cultural formalwear, tailored suits, and elegant occasionwear.",
    },
    {
      title: "Shoes",
      text: "Block heels, wedges, flats, or comfortable dress shoes are recommended for the gardens.",
    },
  ],
};

const dressCodeIcons = [Palette, Shirt, Footprints];

const faqs = [
  {
    question: "Where is the wedding?",
    answer:
      "Caversham House in the Swan Valley. The ceremony is planned for Garden House, followed by reception at Main House.",
  },
  {
    question: "What time should I arrive?",
    answer:
      "The ceremony begins at 4:00 PM. We recommend arriving prior to 3:30 PM so you have time to park, find your seat, and enjoy the gardens before the ceremony begins.",
  },
  {
    question: "Do we need to travel between the ceremony and reception?",
    answer:
      "No. Both the ceremony and reception are at Caversham House. Guests will move from Garden House to Main House within the venue grounds.",
  },
  {
    question: "What should I wear?",
    answer:
      "We would love our guests to dress in soft garden-party tones. Pastels, blush, champagne and sage tones, and elegant neutrals will fit beautifully.",
  },
  {
    question: "Can I bring a plus one?",
    answer:
      "Your invitation will show the names of everyone included. If you are unsure, please message us before submitting your RSVP.",
  },
  {
    question: "Are children invited?",
    answer:
      "Children are very welcome to attend the ceremony at the Garden House. The reception at Main House will be adults only, so we kindly ask that little ones are collected or cared for after the ceremony.",
  },
  {
    question: "When should I RSVP by?",
    answer:
      "The final RSVP date will be added once formal invitations are sent. We kindly ask that guests RSVP by the due date so we can finalise numbers with the venue.",
  },
  {
    question: "Can I include dietary requirements?",
    answer:
      "Yes, please include any dietary requirements when you submit your RSVP so we can pass them on to the venue.",
  },
  {
    question: "Is there parking at the venue?",
    answer:
      "Parking details will be confirmed closer to the day. We recommend allowing extra time for arrival, especially if you are travelling from outside the Swan Valley.",
  },
  {
    question: "Can we take photos during the ceremony?",
    answer:
      "We would love everyone to be fully present during the ceremony. Our photographers and videographers will capture the special moments, and guests are welcome to take photos during the celebration afterwards.",
  },
  {
    question: "Should we bring confetti?",
    answer:
      "No need to bring confetti. We will keep everyone updated if there is anything planned for the ceremony exit.",
  },
  {
    question: "Is there a gift registry?",
    answer:
      "Your presence is the greatest gift. If you would still like to contribute, wishing well details will be shared with the formal invitation.",
  },
];

function GuestsArrivalIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 64"
      className="h-8 w-8 shrink-0 text-[#b98d83]"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.25"
    >
      <path d="M32 59.3c-1.3-7.2-5.8-14.2-9.7-20.8-4-6.8-7-13.2-6.4-21 .7-8.6 7.3-14 16.1-14s15.4 5.4 16.1 14c.5 7.2-2.2 13.3-5.8 19.4-4.4 7.3-8.9 14.4-10.3 22.4z" />
      <circle cx="32" cy="24.7" r="8.2" />
      <path d="M40.5 38.8c3.7-4.2 6.7-8.6 8.6-13.5 2.7 5.3-.6 10.6-8.6 15.3" />
      <path d="M36.5 47.1c5.7-7.2 11.4-11.5 17-11.6-2.8 8-8.3 12.3-17 14.2" />
      <path d="M32.1 59.2c1.6-7.3 4.7-13.8 8.4-20.4" />
    </svg>
  );
}

function CeremonyIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 64"
      className="h-8 w-8 shrink-0 text-[#b98d83]"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.25"
    >
      <path d="M32.5 31.8c-5.9-.6-8.2-5.6-7.2-12.2.7-4.6 3.6-7.6 7.1-8.6 1.7-.5 3.4-1.2 4.7-2.5 2.8-2.8 8.6-1.9 11.5 1.5 2.8 3.4 2.9 8.3.9 11.7" />
      <path d="M31.8 31.8c-4.7-3.1-8.3-7.2-10.7-12.4-1.7-3.6-5.4-5-8.5-3.8-3.4 1.3-5.3 5.2-3.4 8.4 1.4 2.4 3.7 3.1 5.7 5.2 2.2 2.3 3.7 4.9 8.1 4.6 3.2-.2 5.9.9 8.8 4.2" />
      <path d="M32.3 31.9c2-5.5 5.6-9.6 10.5-12.6 4.6-2.9 9.3-.7 10.5 3.4 1.2 4.2-.9 8.5-5.1 10.5-3.5 1.7-7.6 1.7-11.1 2.8-3.1.9-4.2 3.2-5.8 5.5" />
      <path d="M32 31.8c-3.9-4.6-5.8-10.8-5.2-16.5" />
      <path d="M32 31.8c1.6-4.9 3.4-10.2 5.3-15.8" />
      <path d="M32 31.8c-1.1-4-1.9-7.8-2.4-11.3" />
      <path d="M32 31.8c2.9-3.5 5.5-7.3 7.9-11.4" />
      <path d="M30.7 20.1h.1" />
      <path d="M36.8 15.8h.1" />
      <path d="M40.2 20h.1" />
      <path d="M32.1 31.8c-4.1 9-3.1 17.7-.2 25.2" />
      <path d="M32 57c.8-5.7 4-10.1 9.6-13.1 5.1-2.7 8.6-5.7 11.1-9.8-5.8 3.3-11 5.8-15.8 8.9-4.1 2.7-5.2 6-4.9 14z" />
      <path d="M31.9 57c-1.5-6.5-5.2-10.6-10.7-14.5-4.8-3.4-7.5-7.8-7.9-13.4 4.3 5.4 9 9.2 13.1 13.9 3.4 3.9 5.4 8.3 5.5 14z" />
      <path d="M23.5 47.6c-2.7-2.6-5.6-4.7-8.8-6.4" />
      <path d="M17.4 42.6c-2-.3-3.7.1-5.3 1.2 1.8.7 3.5.8 5.3.3" />
      <path d="M18.2 43c-.7-1.9-1.8-3.3-3.4-4.4-.3 1.8.1 3.3 1.4 4.8" />
      <path d="M42.1 49.1c2.8-2.9 5.9-5.2 9.3-7" />
      <path d="M48.6 43.4c2.1-.4 3.8-1.2 5.2-2.5.4 2-1.5 3.3-4.5 4.1" />
      <path d="M47.5 44.2c-.2-1.9.3-3.5 1.4-4.9.9 1.3.8 3-.3 5.1" />
    </svg>
  );
}

function GuestsSeatedIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 64"
      className="h-8 w-8 shrink-0 text-[#b98d83]"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.25"
    >
      <path d="M22.7 35.9v-7.1c0-4.8-2.4-9.6-2.4-15.2C20.3 6.5 25.2 3.7 32 3.7s11.7 2.8 11.7 9.9c0 5.6-2.4 10.4-2.4 15.2v7.1" />
      <path d="M25.8 34.3v-6.1c0-4.2-1.8-8.8-1.8-13.9C24 9.3 27.3 6.6 32 6.6s8 2.7 8 7.7c0 5.1-1.8 9.7-1.8 13.9v6.1" />
      <path d="M17.1 38.8c2.7-3.2 9-4.5 14.9-4.5s12.2 1.3 14.9 4.5" />
      <path d="M13.7 38.9c1.9 1.5 10.1 2.9 18.3 2.9s16.4-1.4 18.3-2.9" />
      <path d="M13.7 38.9v3.1c2.2 1.4 10.2 2.7 18.3 2.7s16.1-1.3 18.3-2.7v-3.1" />
      <path d="M14.4 42.4c-.5 4.4.9 6.8 1.2 9.9.2 2.4-.7 5-1.1 7.1-.2 1.1.6 1.9 1.7 1.3 2.4-1.4 2.5-5.2 2.8-8.4.2-2.7.9-5.2 2.2-6.8" />
      <path d="M49.6 42.4c.5 4.4-.9 6.8-1.2 9.9-.2 2.4.7 5 1.1 7.1.2 1.1-.6 1.9-1.7 1.3-2.4-1.4-2.5-5.2-2.8-8.4-.2-2.7-.9-5.2-2.2-6.8" />
      <path d="M22.5 45.2c.9 1.1 2.1 1.7 3.3 1.3 1.3-.4 2.5 1.5 6.2 1.5s4.9-1.9 6.2-1.5c1.2.4 2.4-.2 3.3-1.3" />
      <path d="M20.7 37.2c-1.2-2.9-1.1-6.8-.1-9.8" />
      <path d="M43.3 37.2c1.2-2.9 1.1-6.8.1-9.8" />
      <path d="M21.2 25.1c-1.3-1.1-3.3-1.4-5.7-.5-2.4.9-4.1 2.6-4.2 4.5-.1 1.5.9 2.6 2.5 2.9" />
      <path d="M42.8 25.1c1.3-1.1 3.3-1.4 5.7-.5 2.4.9 4.1 2.6 4.2 4.5.1 1.5-.9 2.6-2.5 2.9" />
      <path d="M14 32c1.2 1.5 4.1 1.1 6.4-.5 2.5-1.6 3.7-4 2.7-5.4" />
      <path d="M50 32c-1.2 1.5-4.1 1.1-6.4-.5-2.5-1.6-3.7-4-2.7-5.4" />
      <path d="M13.7 32.1c2.7.6 3.2 4.3 2.4 6.8" />
      <path d="M50.3 32.1c-2.7.6-3.2 4.3-2.4 6.8" />
    </svg>
  );
}

function FarewellIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 64"
      className="h-8 w-8 shrink-0 text-[#b98d83]"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.25"
    >
      <path d="M38.7 7.2C24.5 9.4 12.2 22.4 12.2 38.5c0 12.6 8 21.1 20 22 9.2.7 18.5-4.3 24.1-12.1-8.6 4.8-20.3 4-28.6-4.5-11.5-11.9-8.2-29.3 11-36.7z" />
      <path d="M46.3 20.5c1.2 7.2 2.9 9 10.1 10.1-7.2 1.2-8.9 2.9-10.1 10.1-1.2-7.2-2.9-8.9-10.1-10.1 7.2-1.1 8.9-2.9 10.1-10.1z" />
    </svg>
  );
}

function DancingIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 64"
      className="h-8 w-8 shrink-0 text-[#b98d83]"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.25"
    >
      <path d="M18.6 44.7V22.5c0-2.9 1.3-4.8 4.4-5.3 8.8-1.3 16.9-2.8 23-9v23.9" />
      <path d="M18.6 29.7c1.2-3 3.5-4.3 7.5-4.9 7.1-1 14.2-2.6 19.9-6.7" />
      <ellipse cx="13.6" cy="49" rx="6.8" ry="4.5" transform="rotate(-24 13.6 49)" />
      <ellipse cx="40.7" cy="36" rx="6.8" ry="4.5" transform="rotate(-24 40.7 36)" />
      <path d="M54.1 11.2c.8 4.7 1.9 5.8 6.6 6.6-4.7.8-5.8 1.9-6.6 6.6-.8-4.7-1.9-5.8-6.6-6.6 4.7-.8 5.8-1.9 6.6-6.6z" />
      <path d="M54.1 5.8h.1" />
      <path d="M60.5 25.3h.1" />
      <path d="M56.1 30.4h.1" />
    </svg>
  );
}

function ReceptionDinnerIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 64"
      className="h-8 w-8 shrink-0 text-[#b98d83]"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.25"
    >
      <path d="M14 42.1c0-14.7 8.1-24.6 18-24.6s18 9.9 18 24.6" />
      <path d="M10.1 42.1h43.8c1.7 0 3 1.3 3 3s-1.3 3-3 3H10.1c-1.7 0-3-1.3-3-3s1.3-3 3-3z" />
      <path d="M14.3 48.1c1.4 2.8 5 4 10.7 4h14c5.7 0 9.3-1.2 10.7-4" />
      <path d="M28.4 17.8c.2-1.8 1.6-3.1 3.6-3.1s3.4 1.3 3.6 3.1" />
      <path d="M29.7 14.7c-1.5-3.4-.4-6.7 2.3-6.7s3.8 3.3 2.3 6.7" />
      <path d="M18.2 34.6c2.2-5.5 5.5-9.2 9.7-11" />
    </svg>
  );
}

function DrinksPhotosIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 64 64"
      className="h-8 w-8 shrink-0 text-[#b98d83]"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.25"
    >
      <path d="M11.2 39.1V20.4c0-2.5 1.6-4.1 4.1-4.1h7.5l2.5-5.3c.6-1.2 1.7-1.9 3.1-1.9h9.2c1.4 0 2.5.7 3.1 1.9l2.5 5.3h7.5c2.5 0 4.1 1.6 4.1 4.1v5.2" />
      <path d="M16.2 16.3v-3.4h5.8v3.4" />
      <path d="M16.5 21.9h3.5" />
      <path d="M36 48.7c-2 .8-4.2 1.3-6.5 1.3-9.2 0-16.6-7.4-16.6-16.6" />
      <path d="M20.6 35.2c.8 4.2 4.4 7.3 8.8 7.3 2.4 0 4.6-.9 6.2-2.4" />
      <path d="M38.4 24.2c-2-2.2-4.8-3.5-8-3.5-6 0-10.8 4.8-10.8 10.8 0 1.1.2 2.2.5 3.2" />
      <path d="M43.2 33.7c.8 1.7 1.1 3.4 1.1 5.4v11.2c0 3.6-2 5.4-5.5 5.4h-9.2" />
      <path d="M35 28.7c.7 6.4 5.9 10.3 13.6 10.3s12.9-3.9 13.6-10.3c-3-1.4-8.1-2.3-13.6-2.3s-10.6.9-13.6 2.3z" />
      <path d="M36.3 28.9c2.7 1.4 7.2 2.2 12.3 2.2s9.6-.8 12.3-2.2" />
      <path d="M48.6 39v12" />
      <path d="M42.8 55.7c1.2-2.4 10.4-2.4 11.6 0" />
      <path d="M45.6 34.9h.1" />
      <path d="M48.7 34.2h.1" />
      <path d="M58.7 19.2c.5 3 .9 3.4 3.9 3.9-3 .5-3.4.9-3.9 3.9-.5-3-.9-3.4-3.9-3.9 3-.5 3.4-.9 3.9-3.9z" />
      <path d="M26.5 55.7c-9.1.3-15.1-3.1-20.1-9.8 5.9-.2 10.7 1.3 14.5 5.1" />
      <path d="M19.7 51.2c-5.1-5.8-7.2-12.3-6-19.6 3.9 3.9 5.9 8.5 5.8 13.8" />
      <path d="M20.4 51.4c-3.6-3.5-2.6-7.9.8-11.9 2.2 4.6 1.9 8.4-.8 11.9z" />
      <path d="M20.8 52.3c-4.2-2.3-8.5-2.3-12.7.2 4 3.1 8.1 3.1 12.7-.2z" />
    </svg>
  );
}

function ItineraryIcon({ title }: { title: string }) {
  if (title === "Guests Arrival") {
    return <GuestsArrivalIcon />;
  }

  if (title === "Ceremony") {
    return <CeremonyIcon />;
  }

  if (title === "Guests Seated") {
    return <GuestsSeatedIcon />;
  }

  if (title === "Farewell") {
    return <FarewellIcon />;
  }

  if (title === "Dancing & Celebration") {
    return <DancingIcon />;
  }

  if (title === "Reception Dinner") {
    return <ReceptionDinnerIcon />;
  }

  if (title === "Drinks & Photos") {
    return <DrinksPhotosIcon />;
  }

  return <Clock className="h-5 w-5 text-[#b98d83]" />;
}

function FadeInSection({ children, className = "" }: FadeInSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SoftSection({ children, id, className = "", contentClassName = "mx-auto max-w-6xl" }: SoftSectionProps) {
  return (
    <section
      id={id}
      className={`relative overflow-hidden scroll-mt-24 bg-[#fbf7f2] px-6 py-24 md:py-32 ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#fbf7f2] to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#fbf7f2] to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,_rgba(232,174,168,0.13),_transparent_32%),radial-gradient(circle_at_82%_76%,_rgba(218,192,138,0.12),_transparent_34%)]" />
      <FadeInSection className={`relative ${contentClassName}`}>{children}</FadeInSection>
    </section>
  );
}

function SectionHeading({ eyebrow, title, subtitle }: SectionHeadingProps) {
  return (
    <div className="mx-auto mb-10 max-w-3xl text-center">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-stone-500">{eyebrow}</p>
      <h2 className="rose-gold-foil font-serif text-4xl md:text-5xl">{title}</h2>
      {subtitle && <p className="mt-4 text-base leading-7 text-stone-600 md:text-lg">{subtitle}</p>}
    </div>
  );
}

function FaqItem({ item, index }: { item: Faq; index: number }) {
  const [open, setOpen] = useState(index === 0);

  return (
    <div className="rounded-2xl border border-stone-200 bg-white/70 shadow-sm backdrop-blur transition duration-300 ease-out hover:-translate-y-[1px] hover:shadow-[0_12px_30px_rgba(90,65,50,0.10)]">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition duration-300 ease-out"
      >
        <span className="font-medium text-stone-800">{item.question}</span>
        <ChevronDown className={`h-5 w-5 text-stone-500 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="px-5 pb-5 text-sm leading-6 text-stone-600">{item.answer}</p>}
    </div>
  );
}

function VenueCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(true);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  const pauseAfterInteraction = useCallback(() => {
    setIsManuallyPaused(true);

    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
    }

    resumeTimerRef.current = setTimeout(() => {
      setIsManuallyPaused(false);
      resumeTimerRef.current = null;
    }, venueManualPauseDelay);
  }, []);

  const goToPrevious = useCallback(
    (manual = true) => {
      if (manual) {
        pauseAfterInteraction();
      }

      setCurrentIndex((prev) => (prev === 0 ? venueImages.length - 1 : prev - 1));
    },
    [pauseAfterInteraction],
  );

  const goToNext = useCallback(
    (manual = true) => {
      if (manual) {
        pauseAfterInteraction();
      }

      setCurrentIndex((prev) => (prev === venueImages.length - 1 ? 0 : prev + 1));
    },
    [pauseAfterInteraction],
  );

  const goToImage = useCallback(
    (index: number) => {
      pauseAfterInteraction();
      setCurrentIndex(index);
    },
    [pauseAfterInteraction],
  );

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleMotionPreference = () => setPrefersReducedMotion(motionQuery.matches);

    handleMotionPreference();
    motionQuery.addEventListener("change", handleMotionPreference);

    return () => motionQuery.removeEventListener("change", handleMotionPreference);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || isHovering || isManuallyPaused) {
      return;
    }

    const interval = setInterval(() => goToNext(false), venueAutoPlayDelay);

    return () => clearInterval(interval);
  }, [goToNext, isHovering, isManuallyPaused, prefersReducedMotion]);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
      }
    };
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goToPrevious();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      goToNext();
    }
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null) {
      return;
    }

    const touchEndX = event.changedTouches[0]?.clientX;

    if (touchEndX === undefined) {
      touchStartXRef.current = null;
      return;
    }

    const swipeDistance = touchEndX - touchStartXRef.current;

    if (Math.abs(swipeDistance) > venueSwipeThreshold) {
      if (swipeDistance > 0) {
        goToPrevious();
      } else {
        goToNext();
      }
    }

    touchStartXRef.current = null;
  };

  return (
    <div
      className="relative overflow-hidden rounded-[2rem] border border-stone-200 bg-white p-3 shadow-xl shadow-stone-300/30 transition duration-300 ease-out hover:shadow-[0_12px_30px_rgba(90,65,50,0.10)]"
      role="region"
      aria-roledescription="carousel"
      aria-label="Venue image carousel"
      tabIndex={0}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem]">
        {venueImages.map((image, index) => (
          <Image
            key={image.src}
            src={image.src}
            alt={image.alt}
            fill
            priority={index === 0}
            sizes="(min-width: 768px) 50vw, 100vw"
            className={`object-cover transition-opacity duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
              index === currentIndex ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => goToPrevious()}
        aria-label="Previous venue image"
        className="absolute left-5 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md transition duration-300 ease-out hover:bg-white hover:shadow-[0_12px_30px_rgba(90,65,50,0.10)]"
      >
        <ChevronLeft className="h-5 w-5 text-stone-900" />
      </button>
      <button
        type="button"
        onClick={() => goToNext()}
        aria-label="Next venue image"
        className="absolute right-5 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md transition duration-300 ease-out hover:bg-white hover:shadow-[0_12px_30px_rgba(90,65,50,0.10)]"
      >
        <ChevronRight className="h-5 w-5 text-stone-900" />
      </button>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {venueImages.map((image, index) => (
          <button
            key={image.src}
            type="button"
            onClick={() => goToImage(index)}
            aria-label={`Show ${image.alt}`}
            className={`h-2 rounded-full transition duration-300 ease-out ${
              index === currentIndex ? "w-6 bg-stone-900" : "w-2 bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function WeddingWebsiteStarter() {
  const [guestInviteToken, setGuestInviteToken] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestLookupMessage, setGuestLookupMessage] = useState("");
  const [attendingCeremony, setAttendingCeremony] = useState("");
  const [attendingReception, setAttendingReception] = useState("");
  const [bringingPlusOne, setBringingPlusOne] = useState("");
  const [plusOneName, setPlusOneName] = useState("");
  const [rsvpSubmitStatus, setRsvpSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [rsvpSubmitMessage, setRsvpSubmitMessage] = useState("");

  const lookupGuestFromInvite = useCallback(async (inviteToken: string) => {
    setGuestInviteToken(inviteToken);
    setGuestLookupMessage("Finding your invitation...");

    try {
      const response = await fetch("/api/rsvp/lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: inviteToken }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
        guest?: {
          fullName?: string;
          attendingCeremony?: boolean | null;
          attendingReception?: boolean | null;
          bringingPlusOne?: boolean;
          plusOneName?: string | null;
          dietaryRequirements?: string | null;
          songRequest?: string | null;
        };
      };

      if (!response.ok || !result.ok || !result.guest?.fullName) {
        throw new Error(result.error ?? "We could not find this invitation.");
      }

      setGuestName(result.guest.fullName);
      setAttendingCeremony(
        typeof result.guest.attendingCeremony === "boolean" ? (result.guest.attendingCeremony ? "yes" : "no") : "",
      );
      setAttendingReception(
        typeof result.guest.attendingReception === "boolean" ? (result.guest.attendingReception ? "yes" : "no") : "",
      );
      setBringingPlusOne(result.guest.bringingPlusOne ? "yes" : "");
      setPlusOneName(result.guest.plusOneName ?? "");
      setGuestLookupMessage(`RSVP loaded for ${result.guest.fullName}.`);
    } catch (error) {
      setGuestLookupMessage(error instanceof Error ? error.message : "We could not find this invitation.");
    }
  }, []);

  useEffect(() => {
    const inviteToken = new URLSearchParams(window.location.search).get("guest");

    if (inviteToken) {
      const lookupTimer = window.setTimeout(() => {
        void lookupGuestFromInvite(inviteToken);
      }, 0);

      return () => window.clearTimeout(lookupTimer);
    }
  }, [lookupGuestFromInvite]);

  const handleCeremonyAttendanceChange = (value: string) => {
    setAttendingCeremony(value);
  };

  const handlePlusOneChange = (value: string) => {
    setBringingPlusOne(value);

    if (value !== "yes") {
      setPlusOneName("");
    }
  };

  const handleRsvpSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const dietaryRequirements = String(formData.get("dietaryRequirements") ?? "").trim();
    const songRequest = String(formData.get("songRequest") ?? "").trim();
    const trimmedGuestName = guestName.trim();

    if (!trimmedGuestName) {
      setRsvpSubmitStatus("error");
      setRsvpSubmitMessage("Please enter your full name before submitting.");
      return;
    }

    if (!attendingCeremony || !attendingReception) {
      setRsvpSubmitStatus("error");
      setRsvpSubmitMessage("Please answer both ceremony and reception attendance questions.");
      return;
    }

    if (bringingPlusOne === "yes" && !plusOneName.trim()) {
      setRsvpSubmitStatus("error");
      setRsvpSubmitMessage("Please enter your +1's name.");
      return;
    }

    setRsvpSubmitStatus("submitting");
    setRsvpSubmitMessage("");

    try {
      const response = await fetch("/api/rsvp/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inviteToken: guestInviteToken || undefined,
          guestName: trimmedGuestName,
          attendingCeremony: attendingCeremony === "yes",
          attendingReception: attendingReception === "yes",
          bringingPlusOne: bringingPlusOne === "yes",
          plusOneName: bringingPlusOne === "yes" ? plusOneName.trim() : null,
          dietaryRequirements,
          songRequest,
        }),
      });

      const result = (await response.json()) as { ok?: boolean; error?: string; message?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Something went wrong while saving your RSVP.");
      }

      form.reset();
      if (!guestInviteToken) {
        setGuestName("");
        setAttendingCeremony("");
        setAttendingReception("");
        setBringingPlusOne("");
        setPlusOneName("");
      }
      setRsvpSubmitStatus("success");
      setRsvpSubmitMessage(result.message ?? "Thank you. Your RSVP has been saved.");
    } catch (error) {
      setRsvpSubmitStatus("error");
      setRsvpSubmitMessage(error instanceof Error ? error.message : "Something went wrong while saving your RSVP.");
    }
  };

  return (
    <main className="min-h-screen bg-[#fbf7f2] text-stone-800">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_14%,_rgba(203,185,163,0.36),_transparent_31%),radial-gradient(circle_at_82%_24%,_rgba(143,154,125,0.14),_transparent_30%),radial-gradient(circle_at_58%_78%,_rgba(185,130,120,0.12),_transparent_34%)]" />
        <div className="absolute left-1/2 top-8 -z-10 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/35 blur-3xl" />

        <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <Image
            src="/images/sa-monogram.png"
            alt="Sumaya and Aditya monogram"
            width={599}
            height={792}
            priority
            className="h-12 w-auto object-contain sm:h-14"
          />
          <div className="hidden items-center gap-8 text-sm text-[#3f302b] md:flex">
            <a href="#details" className="transition-colors duration-300 ease-out hover:text-[#b98278]">
              Details
            </a>
            <a href="#dress-code" className="transition-colors duration-300 ease-out hover:text-[#b98278]">
              Dress Code
            </a>
            <a href="#itinerary" className="transition-colors duration-300 ease-out hover:text-[#b98278]">
              Itinerary
            </a>
            <a href="#venue" className="transition-colors duration-300 ease-out hover:text-[#b98278]">
              Venue
            </a>
            <a
              href="#rsvp"
              className="rounded-full bg-[#241815] px-5 py-2 text-white shadow-[0_10px_24px_rgba(36,24,21,0.16)] transition duration-300 ease-out hover:-translate-y-[1px] hover:bg-[#382722] hover:shadow-[0_12px_30px_rgba(36,24,21,0.20)]"
            >
              RSVP
            </a>
          </div>
        </nav>

        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-10 md:grid-cols-[1.08fr_0.82fr] md:pb-28 md:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-[560px]"
          >
            <a
              href={googleCalendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Add Sumaya and Aditya's wedding to Google Calendar"
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#eaded6] bg-[#fffaf7]/70 px-4 py-2 text-xs font-medium uppercase tracking-[0.25em] text-[#4f4641] shadow-[0_8px_22px_rgba(90,65,50,0.05)] backdrop-blur transition duration-300 ease-out hover:-translate-y-[1px] hover:border-[#d8bd96] hover:bg-[#fffaf7]/90 hover:shadow-[0_12px_30px_rgba(90,65,50,0.10)]"
            >
              <CalendarPlus className="h-4 w-4 text-[#8f9a7d]" />
              Save the date
            </a>

            <div className="hero-name-wrap">
              <h1 className="font-serif text-5xl leading-[1.08] sm:text-6xl md:text-8xl">
                <span className="rose-gold-foil hero-name-text">Sumaya</span>
                <span className="rose-gold-foil hero-name-text block">& Aditya</span>
              </h1>
            </div>

            <p className="mt-8 max-w-xl font-serif text-[16px] leading-[1.7] text-[#6a5d55]">
              4:00 PM Ceremony <span className="mx-2 text-[#d8bd96]">&middot;</span> Garden House, Caversham House
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.15 }}
            className="relative mx-auto w-full max-w-[332px] sm:max-w-[350px] md:max-w-[365px]"
          >
            <div className="absolute -left-8 top-10 h-32 w-32 rounded-full bg-[#eaded6]/45 blur-3xl" />
            <div className="absolute -bottom-8 -right-8 h-40 w-40 rounded-full bg-[#d8bd96]/30 blur-3xl" />
            <div className="relative rounded-[30px] border border-[#efe4dc]/80 bg-[#fffaf7]/58 p-1.5 shadow-[0_16px_42px_rgba(90,65,50,0.08)] backdrop-blur transition duration-300 ease-out hover:-translate-y-[1px] hover:shadow-[0_18px_46px_rgba(90,65,50,0.10)] sm:p-2">
              <Image
                src="/images/venue-card.png"
                alt="Caversham House wedding venue card for Sumaya and Aditya"
                width={921}
                height={1381}
                priority
                className="h-auto w-full rounded-[24px] object-contain"
              />
            </div>
          </motion.div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-28 bg-gradient-to-t from-[#fbf7f2] to-transparent" />
      </section>

      <section className="relative bg-[#fbf7f2] px-6 py-20 md:py-28">
        <FadeInSection className="mx-auto max-w-[760px] text-center">
          <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.42em] text-[#6e5b54]">A NOTE FROM US</p>
          <div className="space-y-5 font-serif text-[22px] font-normal leading-[1.55] text-[#3f302b] sm:text-[26px] md:text-[30px] md:leading-[1.5]">
            <p>We are so grateful to be celebrating this day with the people who have been part of our story.</p>
            <p>
              More details will be shared closer to the day, but for now, we would love for you to join us at Caversham
              House for a romantic garden celebration.
            </p>
          </div>
        </FadeInSection>
      </section>

      <SoftSection id="details">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-stone-500">The celebration</p>
          <h2 className="font-serif text-4xl text-[#b58b84] md:text-5xl">
            A garden ceremony, an intimate dinner, and an evening to remember
          </h2>
          <p className="mt-4 text-base leading-7 text-[#4f4641] md:text-lg">
            Our day has been designed to feel romantic, relaxed, and full of warmth — with garden moments, beautiful
            food, music, and time to celebrate with the people we love most.
          </p>
        </div>
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {[
            {
              icon: Flower2,
              title: "Garden Ceremony",
              text: "A soft ceremony at Garden House, set among the greenery and romance of Caversham House.",
            },
            {
              icon: Utensils,
              title: "Dinner at Main House",
              text: "An elegant sit-down reception with good food, warm speeches, and time shared around the table.",
            },
            {
              icon: Music,
              title: "Celebration",
              text: "Music, drinks, and dancing as the evening unfolds.",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-[1.35rem] border border-[#eaded6] bg-[#fffaf7] px-8 py-10 shadow-[0_18px_45px_rgba(101,75,62,0.07)] backdrop-blur-sm transition duration-300 ease-out hover:-translate-y-[1px] hover:shadow-[0_12px_30px_rgba(90,65,50,0.10)]"
            >
              <card.icon className="mb-7 h-6 w-6 text-[#b98278]" />
              <h3 className="font-serif text-2xl text-[#4f4641]">{card.title}</h3>
              <p className="mt-4 leading-7 text-[#4f4641]/80">{card.text}</p>
            </div>
          ))}
        </div>
      </SoftSection>

      <SoftSection id="dress-code">
        <div className="grid items-start gap-12 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="max-w-[590px]">
            <p className="mb-5 text-[11px] font-medium uppercase tracking-[0.42em] text-[#6e5b54]">
              {dressCode.eyebrow}
            </p>
            <h2 className="font-serif text-[42px] leading-[1] tracking-normal text-[#b58b84] sm:text-[48px] md:text-[58px] lg:text-[62px]">
              Romantic Garden
              <br />
              Formal
            </h2>
            <div className="mt-9 space-y-7 text-[17px] leading-[1.9] text-[#4f4641]">
              <p>{dressCode.intro}</p>
              <p>{dressCode.details}</p>
            </div>
            <div className="mt-9 space-y-4 border-l border-[#d8b8ad] pl-5">
              <p className="text-[14px] leading-[1.8] text-[#5c514b]">{dressCode.note}</p>
              <p className="text-[14px] leading-[1.8] text-[#5c514b]">{dressCode.shoeNote}</p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3 lg:grid-cols-1">
            {dressCode.cards.map((card, index) => {
              const Icon = dressCodeIcons[index];

              return (
                <div
                  key={card.title}
                  className="rounded-[1.35rem] border border-[#e8ddd4]/70 bg-[#fffdf8]/75 px-7 py-7 shadow-[0_12px_34px_rgba(101,75,62,0.045)] backdrop-blur-sm transition duration-300 ease-out hover:-translate-y-[1px] hover:shadow-[0_12px_30px_rgba(90,65,50,0.10)]"
                >
                  <Icon className="mb-6 h-5 w-5 text-[#b98d83]" />
                  <h3 className="font-serif text-2xl text-stone-900">{card.title}</h3>
                  <p className="mt-4 leading-7 text-stone-600">{card.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </SoftSection>

      <SoftSection id="itinerary" contentClassName="mx-auto max-w-4xl">
        <SectionHeading
          eyebrow="Our day"
          title="Wedding itinerary"
          subtitle="The final schedule may be refined closer to the day, but this is the planned flow for guests."
        />
        <div>
          {itinerary.map((item) => (
            <div key={item.title} className="grid grid-cols-[90px_1fr] gap-5 md:grid-cols-[120px_1fr]">
              <div className="pt-1 text-right text-sm font-semibold text-stone-500">{item.time}</div>
              <div className="relative border-l border-stone-300 pb-10 pl-7 last:pb-0">
                <div className="absolute -left-[7px] top-1 h-3.5 w-3.5 rounded-full bg-[#b98d83] ring-4 ring-[#fbf7f2]" />
                <div className="rounded-2xl border border-white/70 bg-white/60 p-5 shadow-sm backdrop-blur transition duration-300 ease-out hover:-translate-y-[1px] hover:shadow-[0_12px_30px_rgba(90,65,50,0.10)]">
                  <div className="flex items-center gap-3">
                    <ItineraryIcon title={item.title} />
                    <h3 className="font-serif text-2xl text-stone-900">{item.title}</h3>
                  </div>
                  <p className="mt-3 leading-7 text-stone-600">{item.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SoftSection>

      <SoftSection id="venue" className="mb-20 mt-24 md:mb-24 md:mt-28">
        <div className="mx-auto mb-14 max-w-3xl text-center md:mb-16">
          <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.25em] text-[#8c7a72]">VENUE</p>
          <h2 className="font-serif text-[42px] leading-[1.2] text-[#a67c6b]">Caversham House</h2>
          <p className="mx-auto mt-4 max-w-[560px] text-[16px] leading-[1.6] text-[#5f524b]">
            A Swan Valley garden setting with a romantic ceremony at Garden House and a reception at Main House.
          </p>
        </div>

        <div className="grid items-center gap-8 md:grid-cols-[1.05fr_0.95fr] md:gap-10">
          <div className="relative isolate">
            <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-[radial-gradient(circle_at_center,_rgba(218,192,138,0.34),_rgba(244,226,190,0.18)_44%,_transparent_72%)] blur-3xl" />
            <VenueCarousel />
          </div>
          <div className="mx-auto w-full max-w-[480px]">
            <div className="rounded-3xl border border-[#eaded6] bg-[#fffaf7]/76 p-6 shadow-[0_12px_34px_rgba(90,65,50,0.055)] backdrop-blur transition duration-300 ease-out hover:-translate-y-[1px] hover:shadow-[0_12px_30px_rgba(90,65,50,0.10)]">
              <h3 className="font-serif text-2xl text-[#4f4641]">Getting There &amp; Parking</h3>
              <div className="mt-4 space-y-3 text-[15px] leading-[1.65] text-[#6a5d55]">
                <p>
                  Caversham House
                  <br />
                  Swan Valley, Perth
                </p>
                <p>
                  Parking is available at the Main House car park. Please follow signage upon arrival.
                </p>
                <p>
                  We recommend arriving 20&ndash;30 minutes before the ceremony to allow time to settle into the
                  gardens.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 overflow-hidden rounded-[2rem] border border-stone-200 shadow-xl shadow-stone-300/30 transition duration-300 ease-out hover:shadow-[0_12px_30px_rgba(90,65,50,0.10)]">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3384.9999!2d115.9905802!3d-31.8777983!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2a32b77920209d99%3A0xeb200b707ad3d95d!2sCaversham%20House%2C%20141%20Caversham%20Ave%2C%20Caversham%20WA%206055!5e0!3m2!1sen!2sau!4v1620000000000"
            width="100%"
            height="450"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </SoftSection>

      <SoftSection id="rsvp" contentClassName="mx-auto max-w-4xl">
        <div className="rounded-[2.25rem] border border-[#eaded6]/20 bg-[#2A1D19] px-5 py-10 text-white shadow-[0_24px_70px_rgba(90,65,50,0.16)] md:px-10 md:py-12">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-[#d8c7bf]">RSVP</p>
            <h2 className="rose-gold-foil font-serif text-4xl md:text-5xl">We hope you can celebrate with us</h2>
            <p className="mt-5 text-lg leading-8 text-[#e6d9d2]">
              We would be so grateful if you could let us know which parts of the day you will be joining and whether
              you will be bringing a +1.
            </p>
          </div>

          <form
            onSubmit={handleRsvpSubmit}
            className="mt-10 rounded-[2rem] border border-[#eaded6]/25 bg-[#fffaf7] p-6 text-[#4f4641] shadow-2xl shadow-black/20 md:p-8"
          >
            <div className="grid gap-6">
              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7b6760]">Guest name</span>
                <input
                  type="text"
                  name="guestName"
                  value={guestName}
                  onChange={(event) => setGuestName(event.target.value)}
                  readOnly={Boolean(guestInviteToken && guestName)}
                  placeholder="Your full name"
                  className="min-h-12 rounded-2xl border border-[#eaded6] bg-white px-4 text-[#4f4641] outline-none transition placeholder:text-[#a99790] read-only:bg-[#fbf7f2] focus:border-[#b98278]"
                />
                {guestLookupMessage && (
                  <span className="text-[13px] leading-[1.6] text-[#7a6a62]">{guestLookupMessage}</span>
                )}
              </label>

              <div className="grid gap-5 md:grid-cols-[1.12fr_0.88fr]">
                <fieldset className="rounded-2xl border border-[#eaded6] bg-white/70 p-5">
                  <legend className="px-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#7b6760]">
                    Will you be joining us for the ceremony?
                  </legend>
                  <div className="mt-4 grid gap-3 text-sm text-[#4f4641]">
                    {["Yes", "No"].map((option) => (
                      <label key={option} className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="attendingCeremony"
                          value={option.toLowerCase()}
                          checked={attendingCeremony === option.toLowerCase()}
                          onChange={() => handleCeremonyAttendanceChange(option.toLowerCase())}
                          className="accent-[#b98278]"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="rounded-2xl border border-[#eaded6] bg-white/70 p-5">
                  <legend className="px-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#7b6760]">
                    Will you be joining us for the reception?
                  </legend>
                  <div className="mt-4 grid gap-3 text-sm text-[#4f4641]">
                    {["Yes", "No"].map((option) => (
                      <label key={option} className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="attendingReception"
                          value={option.toLowerCase()}
                          checked={attendingReception === option.toLowerCase()}
                          onChange={() => setAttendingReception(option.toLowerCase())}
                          className="accent-[#b98278]"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>

              <fieldset className="rounded-2xl border border-[#eaded6] bg-white/70 p-5">
                <legend className="px-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#7b6760]">
                  Will you be bringing a +1?
                </legend>
                <div className="mt-4 grid gap-3 text-sm text-[#4f4641]">
                  {["Yes", "No"].map((option) => (
                    <label key={option} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="bringingPlusOne"
                        value={option.toLowerCase()}
                        checked={bringingPlusOne === option.toLowerCase()}
                        onChange={() => handlePlusOneChange(option.toLowerCase())}
                        className="accent-[#b98278]"
                      />
                      {option}
                    </label>
                  ))}
                </div>

                {bringingPlusOne === "yes" && (
                  <label className="mt-5 grid gap-2 rounded-[18px] border border-[#eaded6] bg-[#fffaf7]/70 p-5">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7b6760]">
                      +1 full name
                    </span>
                    <input
                      type="text"
                      name="plusOneName"
                      value={plusOneName}
                      onChange={(event) => setPlusOneName(event.target.value)}
                      placeholder="Their full name"
                      className="min-h-12 rounded-2xl border border-[#eaded6] bg-white/85 px-4 text-[#4f4641] outline-none transition placeholder:text-[#a99790] focus:border-[#b98278]"
                    />
                    <span className="mt-2 text-[13px] leading-[1.6] text-[#7a6a62]">
                      This helps us keep the guest list and seating plan beautifully organised.
                    </span>
                  </label>
                )}
              </fieldset>

              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7b6760]">
                  Dietary requirements
                </span>
                <textarea
                  name="dietaryRequirements"
                  rows={3}
                  placeholder="Please let us know about any dietary requirements or allergies"
                  className="rounded-2xl border border-[#eaded6] bg-white px-4 py-3 text-[#4f4641] outline-none transition placeholder:text-[#a99790] focus:border-[#b98278]"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7b6760]">Song request</span>
                <input
                  type="text"
                  name="songRequest"
                  placeholder="A song you’d love to hear on the dance floor"
                  className="min-h-12 rounded-2xl border border-[#eaded6] bg-white px-4 text-[#4f4641] outline-none transition placeholder:text-[#a99790] focus:border-[#b98278]"
                />
              </label>

              {rsvpSubmitMessage && (
                <div
                  className={`rounded-2xl border px-5 py-4 text-sm leading-6 ${
                    rsvpSubmitStatus === "success"
                      ? "border-[#d8bd96] bg-[#fbf7f2] text-[#5f524b]"
                      : "border-[#e6c8c2] bg-[#fff4f2] text-[#8b5f58]"
                  }`}
                >
                  {rsvpSubmitMessage}
                </div>
              )}

              <div className="flex flex-col gap-3 border-t border-[#eaded6] pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-6 text-[#7b6760]">
                  Your response will be saved to our wedding RSVP list.
                </p>
                <button
                  type="submit"
                  disabled={rsvpSubmitStatus === "submitting"}
                  className="rounded-full bg-[#241815] px-7 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-[0_12px_30px_rgba(36,24,21,0.18)] transition duration-300 ease-out hover:-translate-y-[1px] hover:bg-[#382722] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {rsvpSubmitStatus === "submitting" ? "Saving..." : "Submit RSVP"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </SoftSection>

      <SoftSection contentClassName="mx-auto max-w-4xl">
        <SectionHeading
          eyebrow="Good to know"
          title="Guest FAQ"
          subtitle="A simple place for guests to quickly find the details without messaging you both separately."
        />
        <div className="grid gap-4">
          {faqs.map((item, index) => (
            <FaqItem key={item.question} item={item} index={index} />
          ))}
        </div>
      </SoftSection>

      <footer className="border-t border-stone-200 px-6 py-10 text-center">
        <p className="font-serif text-3xl text-stone-900">Sumaya & Aditya</p>
        <p className="mt-2 text-sm uppercase tracking-[0.25em] text-stone-500">01 November 2026 &middot; Perth</p>
        <div className="mx-auto mt-6 flex max-w-md items-center justify-center gap-2 rounded-full border border-stone-200 bg-white/60 px-5 py-3 text-sm text-stone-600">
          <Mail className="h-4 w-4" />
          Wedding website and RSVP system in progress
        </div>
      </footer>
    </main>
  );
}
