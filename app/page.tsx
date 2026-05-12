"use client";

import React, { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, type Transition, useReducedMotion } from "framer-motion";
import {
  CalendarPlus,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Flower2,
  Mail,
  MapPin,
  Menu,
  Music,
  Utensils,
  Volume2,
  VolumeX,
  X,
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

type DressCodeSwatch = {
  id: string;
  label: string;
  color: string;
};

type SoftSectionProps = {
  children: ReactNode;
  id?: string;
  className?: string;
  contentClassName?: string;
  panelStep?: string;
  panelLabel?: string;
  backgroundLayer?: ReactNode;
};

const googleCalendarDetails = encodeURIComponent(
  "We can’t wait to celebrate with you.\nPlease arrive from 3:00 PM for a 4:00 PM ceremony in the Garden House, followed by dinner and dancing in the Main House.",
);

const googleCalendarUrl =
  `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Sumaya%20%26%20Aditya%E2%80%99s%20Wedding&dates=20261101T160000/20261101T230000&ctz=Australia%2FPerth&location=Caversham%20House%2C%20141%20Caversham%20Avenue%2C%20Caversham%20WA%206055%2C%20Australia&details=${googleCalendarDetails}`;

const googleDirectionsUrl =
  "https://www.google.com/maps/dir/?api=1&destination=Caversham%20House%2C%20141%20Caversham%20Avenue%2C%20Caversham%20WA%206055%2C%20Australia";

const googleVenueMapUrl =
  "https://www.google.com/maps/search/?api=1&query=Caversham%20House%2C%20141%20Caversham%20Avenue%2C%20Caversham%20WA%206055%2C%20Australia";

const venueAddress = "Caversham House, 141 Caversham Avenue, Caversham WA 6055";

const venueImages = [
  { src: "/images/venue.jpg", alt: "Caversham House Gardens" },
  { src: "/images/venue2.jpg", alt: "Caversham House Main Building" },
  { src: "/images/venue3.png", alt: "Caversham House garden lawn and gazebo" },
];

const venueAutoPlayDelay = 6800;
const venueManualPauseDelay = 7600;
const venueSwipeThreshold = 40;
const gateOpenEase = [0.16, 1, 0.3, 1] as const;
const invitationRevealEase = [0.22, 1, 0.36, 1] as const;
const cinematicRevealEase = [0.19, 1, 0.22, 1] as const;
const ambientAudioSrc = "/audio/until-i-found-you-violin-piano-wedding-version.mp3";
const ambientAudioTargetVolume = 0.22;
const ambientAudioFadeDuration = 1800;

const clampProgress = (value: number) => Math.max(0, Math.min(1, value));

const smoothProgress = (value: number) => {
  const progress = clampProgress(value);
  return progress * progress * (3 - 2 * progress);
};

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
  title: "Garden Pastels & Classic Formal",
  description:
    "We invite our guests to dress in soft, garden-inspired tones paired with classic formal styling. Gentle, muted shades are preferred to create a refined and cohesive palette.",
  pastelFormalCopy: [
    "Soft pastel gowns, sarees, lehengas, cocktail dresses, and elegant formalwear in garden-inspired tones are warmly welcome.",
    "Flowing fabrics, soft silhouettes, and romantic textures are encouraged.",
  ],
  classicFormalCopy: [
    "Classic tailoring in navy, charcoal, beige, or black pairs beautifully with crisp white shirts and refined blush accents.",
    "Tailored suits, blazers, and well-fitted formal shirts are all welcome — the emphasis is on clean lines, thoughtful details, and a polished finish.",
  ],
};

const dressCodePastelPalette: DressCodeSwatch[] = [
  { id: "pastel-blush-pink", label: "Blush Pink", color: "#e8c4bf" },
  { id: "pastel-soft-sage", label: "Soft Sage", color: "#c8d0be" },
  { id: "pastel-dusty-lavender", label: "Dusty Lavender", color: "#cfc5d6" },
  { id: "pastel-powder-blue", label: "Powder Blue", color: "#c9d5e5" },
  { id: "pastel-nude", label: "Nude", color: "#e4d4c9" },
  { id: "pastel-champagne", label: "Champagne", color: "#e8d7bd" },
];

const dressCodeClassicPalette: DressCodeSwatch[] = [
  { id: "classic-navy", label: "Navy", color: "#1C2238" },
  { id: "classic-charcoal", label: "Charcoal", color: "#4a4a4a" },
  { id: "classic-beige", label: "Beige", color: "#d9cbbf" },
  { id: "classic-black", label: "Black", color: "#1f1f1f" },
];

const swatchRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
  gap: "48px",
  flexWrap: "wrap",
};

const swatchItemStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
};

const swatchCircleStyle: React.CSSProperties = {
  width: "72px",
  height: "72px",
  minWidth: "72px",
  minHeight: "72px",
  aspectRatio: "1 / 1",
  borderRadius: "9999px",
  display: "block",
  flexShrink: 0,
  opacity: 1,
  visibility: "visible",
};

const swatchLabelStyle: React.CSSProperties = {
  display: "block",
  maxWidth: "112px",
  marginTop: "16px",
};

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
    question: "Are children allowed?",
    answer:
      "To allow all guests to fully relax and enjoy the celebration, we have chosen for our wedding day to be an adults-only occasion, with the exception of our flower girl.",
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
      className="h-8 w-8 shrink-0 text-[var(--color-divider)]"
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
      className="h-8 w-8 shrink-0 text-[var(--color-divider)]"
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
      className="h-8 w-8 shrink-0 text-[var(--color-divider)]"
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
      className="h-8 w-8 shrink-0 text-[var(--color-divider)]"
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
      className="h-8 w-8 shrink-0 text-[var(--color-divider)]"
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
      className="h-8 w-8 shrink-0 text-[var(--color-divider)]"
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
      className="h-8 w-8 shrink-0 text-[var(--color-divider)]"
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

  return <Clock className="h-5 w-5 text-[var(--color-divider)]" />;
}

const mobileEditorialNavItems = [
  { href: "#cover", step: "00", label: "Cover" },
  { href: "#details", step: "01", label: "Details" },
  { href: "#dress-code", step: "02", label: "Dress Code" },
  { href: "#itinerary", step: "03", label: "Itinerary" },
  { href: "#venue", step: "04", label: "Venue" },
  { href: "#rsvp", step: "05", label: "RSVP" },
  { href: "#faq", step: "06", label: "FAQ" },
];

function SectionProgressCue({ step, label }: { step?: string; label?: string }) {
  if (!step || !label) {
    return null;
  }

  return (
    <div className="mobile-section-marker" aria-hidden="true">
      <span>{step}</span>
      <span>{label}</span>
    </div>
  );
}

function SoftSection({
  children,
  id,
  className = "",
  contentClassName = "mx-auto max-w-6xl",
  panelStep,
  panelLabel,
  backgroundLayer,
}: SoftSectionProps) {
  return (
    <section
      id={id}
      className={`editorial-panel mobile-invite-section relative overflow-hidden scroll-mt-24 bg-[#fbf7f2] px-6 py-24 md:py-32 ${className}`}
    >
      {backgroundLayer}
      <SectionProgressCue step={panelStep} label={panelLabel} />
      <div className={`relative ${backgroundLayer ? "z-20" : ""} ${contentClassName}`}>{children}</div>
    </section>
  );
}

function SectionHeading({ eyebrow, title, subtitle }: SectionHeadingProps) {
  const shouldReduceMotion = useReducedMotion();
  const reveal = (delay = 0, y = 18) => ({
    initial: shouldReduceMotion ? false : { opacity: 0, y },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.5 },
    transition: { duration: shouldReduceMotion ? 0 : 0.92, delay: shouldReduceMotion ? 0 : delay, ease: cinematicRevealEase },
  });

  return (
    <div className="mx-auto mb-10 max-w-3xl text-center">
      <motion.p className="heading-micro mb-3" {...reveal(0, 10)}>{eyebrow}</motion.p>
      <motion.h2 className="heading-primary" {...reveal(0.12, 18)}>{title}</motion.h2>
      {subtitle && <motion.p className="heading-copy mt-4" {...reveal(0.24, 16)}>{subtitle}</motion.p>}
    </div>
  );
}

function Swatch({ swatch }: { swatch: DressCodeSwatch }) {
  return (
    <div
      className="swatchItem"
      style={swatchItemStyle}
    >
      <div className="swatchCircle" style={{ ...swatchCircleStyle, backgroundColor: swatch.color }} />
      <span className="type-swatch-label swatchLabel" style={swatchLabelStyle}>
        {swatch.label}
      </span>
    </div>
  );
}

function FaqItem({ item, index }: { item: Faq; index: number }) {
  const [open, setOpen] = useState(index === 0);
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.26 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.86,
        delay: shouldReduceMotion ? 0 : Math.min(index * 0.09, 0.42),
        ease: cinematicRevealEase,
      }}
      className="faq-item card-luxe card-luxe-text card-luxe-hover"
    >
      <button
        onClick={() => setOpen(!open)}
        className="faq-button flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="type-question">{item.question}</span>
        <ChevronDown className={`faq-icon h-5 w-5 text-[var(--color-divider)] ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={shouldReduceMotion ? false : { height: 0, opacity: 0, y: -4 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0, y: -4 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.58, ease: cinematicRevealEase }}
            className="overflow-hidden"
          >
            <p className="faq-answer type-card-body px-5 pb-5">{item.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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

  const currentVenueImage = venueImages[currentIndex];

  return (
    <div
      className="card-luxe-image card-luxe-hover relative h-full"
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
      <div className="card-luxe-media-frame relative aspect-[4/3]">
        {venueImages.map((image, index) => (
          <Image
            key={image.src}
            src={image.src}
            alt={image.alt}
            fill
            loading="lazy"
            sizes="(min-width: 768px) 50vw, 100vw"
            className={`venue-carousel-image object-cover contrast-[1.04] saturate-[0.88] motion-reduce:transition-none ${
              index === currentIndex ? "venue-carousel-image-active opacity-100" : "opacity-0"
            }`}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => goToPrevious()}
        aria-hidden="true"
        tabIndex={-1}
        className="venue-carousel-tap-zone venue-carousel-tap-zone-left md:hidden"
      />
      <button
        type="button"
        onClick={() => goToNext()}
        aria-hidden="true"
        tabIndex={-1}
        className="venue-carousel-tap-zone venue-carousel-tap-zone-right md:hidden"
      />

      <button
        type="button"
        onClick={() => goToPrevious()}
        aria-label="Previous venue image"
        className="venue-carousel-control absolute left-5 top-1/2 -translate-y-1/2 rounded-full transition duration-300 ease-out"
      >
        <ChevronLeft className="h-5 w-5 text-[var(--color-heading)]" />
      </button>
      <button
        type="button"
        onClick={() => goToNext()}
        aria-label="Next venue image"
        className="venue-carousel-control absolute right-5 top-1/2 -translate-y-1/2 rounded-full transition duration-300 ease-out"
      >
        <ChevronRight className="h-5 w-5 text-[var(--color-heading)]" />
      </button>

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {venueImages.map((image, index) => (
          <button
            key={image.src}
            type="button"
            onClick={() => goToImage(index)}
            aria-label={`Show ${image.alt}`}
            className={`venue-carousel-dot h-2 rounded-full transition duration-300 ease-out ${
              index === currentIndex ? "w-6 bg-[var(--color-divider)]" : "w-2 bg-[rgba(255,248,244,0.62)]"
            }`}
          />
        ))}
      </div>
      <div className="venue-carousel-count type-meta" aria-live="polite">
        <span>{currentIndex + 1}</span>
        <span aria-hidden="true">/</span>
        <span>{venueImages.length}</span>
        <span className="sr-only">{currentVenueImage.alt}</span>
      </div>
    </div>
  );
}

export default function WeddingWebsiteStarter() {
  const shouldReduceMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement | null>(null);
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);
  const ambientAudioFadeRef = useRef<number | null>(null);
  const copiedVenueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dressSnapTimerRef = useRef<number | null>(null);
  const dressSnapSettlingRef = useRef(false);
  const dressSnapLastYRef = useRef(0);
  const dressSnapDirectionRef = useRef<"up" | "down">("down");
  const [guestInviteToken] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestLookupMessage] = useState("");
  const [attendingCeremony, setAttendingCeremony] = useState("");
  const [attendingReception, setAttendingReception] = useState("");
  const [bringingPlusOne, setBringingPlusOne] = useState("");
  const [plusOneName, setPlusOneName] = useState("");
  const [rsvpSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [rsvpSubmitMessage] = useState("");
  const [heroScrollProgress, setHeroScrollProgress] = useState(0);
  const [hasMeasuredHeroViewport, setHasMeasuredHeroViewport] = useState(false);
  const [isHeroMobile, setIsHeroMobile] = useState(true);
  const [isMobileGateOpened, setIsMobileGateOpened] = useState(false);
  const [isMobileHeroCopyVisible, setIsMobileHeroCopyVisible] = useState(false);
  const [isAmbientAudioOn, setIsAmbientAudioOn] = useState(false);
  const [isAudioToggleVisible, setIsAudioToggleVisible] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [hasCopiedVenueAddress, setHasCopiedVenueAddress] = useState(false);
  const [canPlayCelebrationVideo, setCanPlayCelebrationVideo] = useState(false);

  const fadeAmbientAudio = useCallback((targetVolume: number, pauseWhenDone = false) => {
    const audio = ambientAudioRef.current;

    if (!audio) {
      return;
    }

    if (ambientAudioFadeRef.current) {
      window.cancelAnimationFrame(ambientAudioFadeRef.current);
      ambientAudioFadeRef.current = null;
    }

    const startVolume = audio.volume;
    const startTime = performance.now();

    const step = (timestamp: number) => {
      const progress = clampProgress((timestamp - startTime) / ambientAudioFadeDuration);
      audio.volume = startVolume + (targetVolume - startVolume) * progress;

      if (progress < 1) {
        ambientAudioFadeRef.current = window.requestAnimationFrame(step);
        return;
      }

      audio.volume = targetVolume;
      ambientAudioFadeRef.current = null;

      if (pauseWhenDone) {
        audio.pause();
      }
    };

    ambientAudioFadeRef.current = window.requestAnimationFrame(step);
  }, []);

  const handleAmbientAudioToggle = useCallback(async () => {
    const audio = ambientAudioRef.current;

    if (!audio) {
      return;
    }

    if (isAmbientAudioOn) {
      setIsAmbientAudioOn(false);
      fadeAmbientAudio(0, true);
      return;
    }

    try {
      audio.loop = true;
      audio.volume = 0;
      await audio.play();
      setIsAmbientAudioOn(true);
      fadeAmbientAudio(ambientAudioTargetVolume);
    } catch {
      setIsAmbientAudioOn(false);
      audio.pause();
      audio.volume = 0;
    }
  }, [fadeAmbientAudio, isAmbientAudioOn]);

  useEffect(() => {
    document.documentElement.classList.add("invite-editorial-scroll");

    return () => {
      document.documentElement.classList.remove("invite-editorial-scroll");
    };
  }, []);

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const updateCelebrationVideoPreference = () => {
      setCanPlayCelebrationVideo(!reducedMotionQuery.matches && mobileQuery.matches);
    };

    updateCelebrationVideoPreference();
    reducedMotionQuery.addEventListener("change", updateCelebrationVideoPreference);
    mobileQuery.addEventListener("change", updateCelebrationVideoPreference);

    return () => {
      reducedMotionQuery.removeEventListener("change", updateCelebrationVideoPreference);
      mobileQuery.removeEventListener("change", updateCelebrationVideoPreference);
    };
  }, []);

  useEffect(() => {
    if (shouldReduceMotion) {
      return;
    }

    const mobileQuery = window.matchMedia("(max-width: 767px)");

    const clearDressSnapTimer = () => {
      if (dressSnapTimerRef.current) {
        window.clearTimeout(dressSnapTimerRef.current);
        dressSnapTimerRef.current = null;
      }
    };

    const settleToElement = (element: HTMLElement, block: ScrollLogicalPosition) => {
      dressSnapSettlingRef.current = true;
      element.scrollIntoView({ block, inline: "nearest", behavior: "smooth" });

      window.setTimeout(() => {
        dressSnapSettlingRef.current = false;
      }, 760);
    };

    const settleDressCodePanel = () => {
      if (!mobileQuery.matches || dressSnapSettlingRef.current) {
        return;
      }

      const panels = Array.from(document.querySelectorAll<HTMLElement>(".dress-code-mobile-panel"));

      if (!panels.length) {
        return;
      }

      const viewportHeight = window.innerHeight;
      let nearestPanel: HTMLElement | null = null;
      let nearestDistance = Number.POSITIVE_INFINITY;
      let nearestVisible = 0;

      for (const panel of panels) {
        const rect = panel.getBoundingClientRect();
        const visible = Math.max(0, Math.min(viewportHeight, rect.bottom) - Math.max(0, rect.top));

        if (visible <= 0) {
          continue;
        }

        const distance = Math.abs(rect.top + rect.height / 2 - viewportHeight / 2);

        if (distance < nearestDistance) {
          nearestPanel = panel;
          nearestDistance = distance;
          nearestVisible = visible;
        }
      }

      if (!nearestPanel || nearestVisible < viewportHeight * 0.28) {
        return;
      }

      const rect = nearestPanel.getBoundingClientRect();
      const isAlreadyFramed = Math.abs(rect.top) <= 10 && Math.abs(rect.bottom - viewportHeight) <= 10;

      if (isAlreadyFramed) {
        return;
      }

      const itinerary = document.querySelector<HTMLElement>("#itinerary");

      if (
        itinerary &&
        dressSnapDirectionRef.current === "down" &&
        nearestPanel.classList.contains("dress-code-mobile-panel-classic") &&
        rect.top < -viewportHeight * 0.18
      ) {
        settleToElement(itinerary, "start");
        return;
      }

      settleToElement(nearestPanel, "center");
    };

    const queueDressSnap = () => {
      const currentY = window.scrollY;

      if (Math.abs(currentY - dressSnapLastYRef.current) > 2) {
        dressSnapDirectionRef.current = currentY > dressSnapLastYRef.current ? "down" : "up";
        dressSnapLastYRef.current = currentY;
      }

      if (dressSnapSettlingRef.current) {
        return;
      }

      clearDressSnapTimer();
      dressSnapTimerRef.current = window.setTimeout(settleDressCodePanel, 125);
    };

    dressSnapLastYRef.current = window.scrollY;
    window.addEventListener("scroll", queueDressSnap, { passive: true });
    window.addEventListener("resize", queueDressSnap);

    return () => {
      clearDressSnapTimer();
      window.removeEventListener("scroll", queueDressSnap);
      window.removeEventListener("resize", queueDressSnap);
      dressSnapSettlingRef.current = false;
    };
  }, [shouldReduceMotion]);

  useEffect(() => {
    const ambientAudio = ambientAudioRef.current;

    return () => {
      if (ambientAudioFadeRef.current) {
        window.cancelAnimationFrame(ambientAudioFadeRef.current);
      }

      if (ambientAudio) {
        ambientAudio.pause();
        ambientAudio.volume = 0;
      }
    };
  }, []);

  useEffect(() => {
    let started = false;

    async function tryPlay() {
      if (started) return;
      const audio = ambientAudioRef.current;
      if (!audio) return;
      try {
        audio.loop = true;
        audio.volume = 0;
        await audio.play();
        started = true;
        setIsAmbientAudioOn(true);
        fadeAmbientAudio(ambientAudioTargetVolume);
      } catch {
        // Blocked by browser — will retry on first user gesture
      }
    }

    function onGesture() {
      void tryPlay();
    }

    void tryPlay();
    window.addEventListener("touchstart", onGesture, { once: true, passive: true });
    window.addEventListener("click", onGesture, { once: true });
    window.addEventListener("scroll", onGesture, { once: true, passive: true });

    return () => {
      window.removeEventListener("touchstart", onGesture);
      window.removeEventListener("click", onGesture);
      window.removeEventListener("scroll", onGesture);
    };
  }, [fadeAmbientAudio]);

  useEffect(() => {
    let animationFrame = 0;

    const updateHeroProgress = () => {
      animationFrame = 0;
      const shouldShowAudioToggle = window.scrollY > 80;

      setIsAudioToggleVisible((current) => (current === shouldShowAudioToggle ? current : shouldShowAudioToggle));

      const hero = heroRef.current;

      if (!hero) {
        return;
      }

      const heroHeight = hero.offsetHeight || window.innerHeight;
      const rawProgress = (window.scrollY - hero.offsetTop) / heroHeight;
      const nextProgress = clampProgress(rawProgress);

      setHeroScrollProgress((currentProgress) =>
        Math.abs(currentProgress - nextProgress) < 0.003 ? currentProgress : nextProgress,
      );
    };

    const requestProgressUpdate = () => {
      if (animationFrame) {
        return;
      }

      animationFrame = window.requestAnimationFrame(updateHeroProgress);
    };

    const updateViewportMode = () => {
      const isMobileViewport = window.innerWidth < 768;
      setIsHeroMobile(isMobileViewport);
      setHasMeasuredHeroViewport(true);

      if (!isMobileViewport) {
        setIsMobileNavOpen(false);
      }

      requestProgressUpdate();
    };

    updateViewportMode();
    window.addEventListener("scroll", requestProgressUpdate, { passive: true });
    window.addEventListener("resize", updateViewportMode);

    return () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }

      window.removeEventListener("scroll", requestProgressUpdate);
      window.removeEventListener("resize", updateViewportMode);
    };
  }, []);

  useEffect(() => {
    let gateTimer = 0;
    let copyTimer = 0;

    const animationFrame = window.requestAnimationFrame(() => {
      if (!isHeroMobile) {
        setIsMobileGateOpened(false);
        setIsMobileHeroCopyVisible(false);
        return;
      }

      if (shouldReduceMotion) {
        setIsMobileGateOpened(true);
        setIsMobileHeroCopyVisible(true);
        return;
      }

      setIsMobileGateOpened(false);
      setIsMobileHeroCopyVisible(false);

      gateTimer = window.setTimeout(() => {
        setIsMobileGateOpened(true);
      }, 260);

      copyTimer = window.setTimeout(() => {
        setIsMobileHeroCopyVisible(true);
      }, 1280);
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);

      if (gateTimer) {
        window.clearTimeout(gateTimer);
      }

      if (copyTimer) {
        window.clearTimeout(copyTimer);
      }
    };
  }, [isHeroMobile, shouldReduceMotion]);

  const handleCeremonyAttendanceChange = (value: string) => {
    setAttendingCeremony(value);
  };

  const handlePlusOneChange = (value: string) => {
    setBringingPlusOne(value);

    if (value !== "yes") {
      setPlusOneName("");
    }
  };

  const handleCopyVenueAddress = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(venueAddress);
      setHasCopiedVenueAddress(true);

      if (copiedVenueTimerRef.current) {
        clearTimeout(copiedVenueTimerRef.current);
      }

      copiedVenueTimerRef.current = setTimeout(() => {
        setHasCopiedVenueAddress(false);
        copiedVenueTimerRef.current = null;
      }, 2400);
    } catch {
      setHasCopiedVenueAddress(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (copiedVenueTimerRef.current) {
        clearTimeout(copiedVenueTimerRef.current);
      }
    };
  }, []);

  const visualScrollProgress = shouldReduceMotion ? 0 : smoothProgress(heroScrollProgress);
  const heavyScrollProgress = shouldReduceMotion || isHeroMobile ? 0 : visualScrollProgress;
  const mobileScrollProgress = shouldReduceMotion || !isHeroMobile ? 0 : visualScrollProgress;
  const mobileGateRevealProgress = isHeroMobile && !shouldReduceMotion ? (isMobileGateOpened ? 1 : 0) : 1;
  const gateOpacity = isHeroMobile
    ? 0.9 - 0.13 * mobileGateRevealProgress - 0.06 * mobileScrollProgress
    : 0.86 * (1 - heavyScrollProgress);
  const gateScale = isHeroMobile ? 1.005 - 0.095 * mobileGateRevealProgress : 1.08;
  const leftGateOffset = isHeroMobile ? 176 * (1 - mobileGateRevealProgress) : -40 * 0.8 * heavyScrollProgress;
  const rightGateOffset = isHeroMobile ? -176 * (1 - mobileGateRevealProgress) : 40 * 0.8 * heavyScrollProgress;
  const leftGateRotateY = isHeroMobile ? -3 - 13 * mobileGateRevealProgress : -18;
  const rightGateRotateY = isHeroMobile ? 3 + 13 * mobileGateRevealProgress : 18;
  const houseFadeProgress = isHeroMobile ? mobileScrollProgress * 0.14 : heavyScrollProgress;
  const houseTranslateY = isHeroMobile ? 0 : -20 * 0.6 * heavyScrollProgress;
  const heroCopyRevealReady =
    shouldReduceMotion || (hasMeasuredHeroViewport && (!isHeroMobile || isMobileHeroCopyVisible));
  const heroRevealKey = hasMeasuredHeroViewport ? (isHeroMobile ? "mobile" : "desktop") : "pending";
  const leftGateInitial = shouldReduceMotion
    ? false
    : isHeroMobile
      ? { opacity: 0.9, x: 176, rotateY: -3, scale: 1.005 }
      : { opacity: 0.7, x: 18, rotateY: -34, scale: gateScale };
  const rightGateInitial = shouldReduceMotion
    ? false
    : isHeroMobile
      ? { opacity: 0.9, x: -176, rotateY: 3, scale: 1.005 }
      : { opacity: 0.7, x: -18, rotateY: 34, scale: gateScale };
  const gateMotionTransition: Transition = isHeroMobile
    ? {
        opacity: { duration: shouldReduceMotion ? 0 : 1.75, delay: shouldReduceMotion ? 0 : 0.2, ease: gateOpenEase },
        x: { duration: shouldReduceMotion ? 0 : 2.65, delay: shouldReduceMotion ? 0 : 0.18, ease: gateOpenEase },
        rotateY: { duration: shouldReduceMotion ? 0 : 2.65, delay: shouldReduceMotion ? 0 : 0.18, ease: gateOpenEase },
        scale: { duration: shouldReduceMotion ? 0 : 2.65, delay: shouldReduceMotion ? 0 : 0.18, ease: gateOpenEase },
      }
    : {
        opacity: { duration: shouldReduceMotion ? 0 : 1.2, ease: gateOpenEase },
        x: { duration: shouldReduceMotion ? 0 : 1.6, ease: gateOpenEase },
        rotateY: { duration: shouldReduceMotion ? 0 : 2.1, delay: shouldReduceMotion ? 0 : 0.12, ease: gateOpenEase },
        scale: { duration: shouldReduceMotion ? 0 : 1.4, ease: gateOpenEase },
      };
  const audioToggleRevealClass = isAudioToggleVisible
    ? "translate-y-0 opacity-70 sm:opacity-100"
    : "translate-y-1.5 opacity-70 sm:translate-y-2.5 sm:opacity-60";
  const audioToggleMotionClass = shouldReduceMotion
    ? ""
    : "transition-[opacity,transform,box-shadow,border-color,background-color,color] duration-[400ms] ease-out hover:scale-[1.02]";
  const heroRevealTiming = isHeroMobile
    ? {
        textDuration: 1.08,
        namesDuration: 1.2,
        dividerDuration: 1.12,
        ctaDuration: 1.08,
        textY: 0,
        namesY: 0,
        ctaY: 3,
        delays: {
          eyebrow: 0,
          names: 0.24,
          divider: 0.48,
          dateVenue: 0.7,
          timeLocation: 0.88,
          cta: 1.42,
          scrollCue: 1.56,
        },
      }
    : {
        textDuration: 1.3,
        namesDuration: 1.36,
        dividerDuration: 1.12,
        ctaDuration: 1.3,
        textY: 0,
        namesY: 0,
        ctaY: 4,
        delays: {
          eyebrow: 0,
          names: 0.24,
          divider: 0.48,
          dateVenue: 0.72,
          timeLocation: 0.96,
          cta: 1.72,
          scrollCue: 1.84,
        },
      };
  const heroRevealTransition = (delay = 0, duration = heroRevealTiming.textDuration): Transition => ({
    duration: shouldReduceMotion ? 0 : duration,
    delay: shouldReduceMotion || !heroCopyRevealReady ? 0 : delay,
    ease: invitationRevealEase,
  });
  const cinematicRevealMotion = (delay = 0, y = 18, duration = 0.92, amount = 0.28) => ({
    initial: shouldReduceMotion ? false : { opacity: 0, y },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount },
    transition: { duration: shouldReduceMotion ? 0 : duration, delay: shouldReduceMotion ? 0 : delay, ease: cinematicRevealEase },
  });
  const cinematicDividerMotion = (delay = 0) => ({
    initial: shouldReduceMotion ? false : { opacity: 0, scaleX: 0 },
    whileInView: { opacity: 1, scaleX: 1 },
    viewport: { once: true, amount: 0.45 },
    transition: { duration: shouldReduceMotion ? 0 : 0.92, delay: shouldReduceMotion ? 0 : delay, ease: cinematicRevealEase },
  });
  const heroTextRevealMotion = (
    delay = 0,
    y = heroRevealTiming.textY,
    duration = heroRevealTiming.textDuration,
  ) => ({
    initial: shouldReduceMotion ? false : { opacity: 0, y },
    animate: heroCopyRevealReady
      ? { opacity: 1, y: 0 }
      : { opacity: 0, y },
    transition: heroRevealTransition(delay, duration),
  });
  const heroNamesRevealMotion = {
    initial: shouldReduceMotion
      ? false
      : {
          opacity: 0,
          y: heroRevealTiming.namesY,
          clipPath: "inset(-22% 50% -36% 50%)",
        },
    animate: heroCopyRevealReady
      ? { opacity: 1, y: 0, clipPath: "inset(-22% 0% -36% 0%)" }
      : { opacity: 0, y: heroRevealTiming.namesY, clipPath: "inset(-22% 50% -36% 50%)" },
    transition: heroRevealTransition(heroRevealTiming.delays.names, heroRevealTiming.namesDuration),
  };
  const heroDividerLineMotion = {
    initial: shouldReduceMotion ? false : { opacity: 0, scaleX: 0 },
    animate: heroCopyRevealReady ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0 },
    transition: heroRevealTransition(heroRevealTiming.delays.divider, heroRevealTiming.dividerDuration),
  };
  const heroDividerMarkMotion = {
    initial: shouldReduceMotion ? false : { opacity: 0 },
    animate: heroCopyRevealReady ? { opacity: 1 } : { opacity: 0 },
    transition: heroRevealTransition(
      heroRevealTiming.delays.divider + (isHeroMobile ? 0.08 : 0.1),
      heroRevealTiming.dividerDuration,
    ),
  };
  const dressRevealMotion = (delay = 0, y = 16) => ({
    initial: shouldReduceMotion ? false : { opacity: 0, y },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.18 },
    transition: { duration: shouldReduceMotion ? 0 : 0.92, delay: shouldReduceMotion ? 0 : delay, ease: cinematicRevealEase },
  });
  return (
    <main className="invite-page min-h-screen bg-[#fbf7f2] text-[var(--color-body)]">
      <audio ref={ambientAudioRef} src={ambientAudioSrc} preload="none" loop />
      <button
        type="button"
        aria-pressed={isAmbientAudioOn}
        aria-label={isAmbientAudioOn ? "Turn ambient sound off" : "Turn ambient sound on"}
        onClick={handleAmbientAudioToggle}
        className={`ambient-audio-toggle type-button fixed bottom-4 right-4 z-50 inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-[rgba(232,207,200,0.78)] bg-[#fffaf7]/76 px-3 py-1.5 text-[var(--color-navy)] shadow-[0_8px_24px_rgba(90,65,50,0.08)] hover:border-[rgba(28,34,56,0.22)] hover:bg-[#fffdf9]/88 hover:text-[var(--color-navy-dark)] hover:opacity-100 hover:shadow-[0_10px_26px_rgba(90,65,50,0.07)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(192,138,122,0.45)] sm:bottom-6 sm:right-6 sm:min-h-11 sm:gap-2 sm:px-4 sm:py-2 ${audioToggleRevealClass} ${audioToggleMotionClass}`}
      >
        {isAmbientAudioOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
        <span>{isAmbientAudioOn ? "Sound On" : "Sound"}</span>
      </button>

      <section
        id="cover"
        ref={heroRef}
        className="editorial-panel hero-section relative isolate overflow-visible bg-[#fbf7f2] text-[var(--color-body)]"
      >
        <div className="hero-inner sticky top-0 h-screen overflow-hidden [perspective:1500px]">
        <div className="absolute inset-0 -z-10 bg-[#fbf7f2]" />
        <div
          className="hero-estate-layer hero-scroll-layer pointer-events-none absolute inset-x-0 bottom-[-3vh] z-[4] mx-auto h-[55vh] min-h-[330px] max-w-[1240px] translate-y-[11%] px-4 sm:h-[58vh] md:min-h-[390px] lg:h-[61vh]"
          style={{
            opacity: isHeroMobile ? 0.92 - houseFadeProgress : 1 - houseFadeProgress,
            transform: isHeroMobile ? `translateY(${-4 * mobileScrollProgress}px)` : `translateY(calc(11% + ${houseTranslateY}px))`,
          }}
        >
          <div className="relative h-full w-full">
            <Image
              src="/images/venue2.jpg"
              alt=""
              fill
              loading="eager"
              fetchPriority="high"
              sizes="(max-width: 767px) 132vw, (min-width: 1024px) 1180px, 100vw"
              className="hero-estate-image"
            />
          </div>
        </div>

        <nav className="absolute inset-x-0 top-0 z-40">
          <div className="mx-auto grid w-full max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center px-5 py-5 sm:px-8 md:px-12 md:py-6">
            <div className="type-nav hidden items-center justify-start gap-8 md:flex lg:gap-10">
              <a href="#details" className="nav-link">
                Details
              </a>
              <a href="#dress-code" className="nav-link">
                Dress Code
              </a>
            </div>

            <a
              href="#"
              aria-label="Sumaya and Aditya wedding home"
              className="mobile-header-monogram absolute top-5 inline-flex shrink-0 -translate-x-1/2 items-center justify-center md:static md:col-start-2 md:translate-x-0 md:justify-self-center"
            >
              <Image
                src="/images/sa-monogram-ornate.png"
                alt="Sumaya and Aditya monogram"
                width={1254}
                height={1254}
                sizes="(min-width: 768px) 76px, 58px"
                loading="eager"
                fetchPriority="high"
                className="sa-monogram h-auto object-contain"
                style={{ width: "clamp(58px, 5vw, 76px)" }}
              />
            </a>

            <div className="type-nav hidden items-center justify-end gap-8 md:flex lg:gap-10">
              <a href="#itinerary" className="nav-link">
                Itinerary
              </a>
              <a href="#venue" className="nav-link">
                Venue
              </a>
              <a
                href="#rsvp"
                className="secondary-cta type-button px-[18px] py-2.5"
              >
                RSVP
              </a>
            </div>

            <button
              type="button"
              aria-label={isMobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMobileNavOpen}
              onClick={() => setIsMobileNavOpen((isOpen) => !isOpen)}
              className="mobile-nav-toggle absolute top-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(232,207,200,0.75)] bg-[#fffaf7]/74 text-[var(--color-navy)] shadow-[0_10px_24px_rgba(106,73,58,0.06)] transition duration-300 ease-out hover:-translate-y-[1px] hover:border-[rgba(28,34,56,0.22)] hover:bg-[#fffdf9] md:hidden"
            >
              {isMobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>

          {isMobileNavOpen && (
            <div className="mobile-nav-panel absolute left-5 top-[82px] z-50 w-[calc(100vw-2.5rem)] border-y border-[rgba(232,207,200,0.55)] bg-[#fffaf7]/92 px-5 py-5 shadow-[0_16px_34px_rgba(106,73,58,0.10)] md:hidden">
              <p className="mobile-nav-kicker">Invitation sections</p>
              <div className="grid gap-1.5">
                {mobileEditorialNavItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileNavOpen(false)}
                    className="mobile-nav-item"
                  >
                    <span>{item.step}</span>
                    <span>{item.label}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </nav>

        {hasMeasuredHeroViewport && (
          <>
            <motion.div
              aria-hidden="true"
              initial={leftGateInitial}
              animate={{ opacity: gateOpacity, x: leftGateOffset, rotateY: leftGateRotateY, scale: gateScale }}
              transition={gateMotionTransition}
              className="hero-gate-art hero-gate-left pointer-events-none absolute bottom-[-7vh] left-[-48vw] z-10 block h-[88vh] min-h-0 origin-left md:left-[-21vw] md:h-[94vh] md:max-h-[1000px] md:min-h-[660px] lg:left-[-13vw] xl:left-[-8vw] 2xl:left-[-2vw]"
              style={{ transformOrigin: "left bottom" }}
            >
              <Image
                src="/images/hero-gate-left-clean.png"
                alt=""
                width={1024}
                height={1536}
                loading="eager"
                sizes="(min-width: 1536px) 640px, (min-width: 1024px) 560px, (min-width: 768px) 45vw, 30vw"
                className="h-full w-auto object-contain object-left-bottom"
              />
            </motion.div>

            <motion.div
              aria-hidden="true"
              initial={rightGateInitial}
              animate={{ opacity: gateOpacity, x: rightGateOffset, rotateY: rightGateRotateY, scale: gateScale }}
              transition={gateMotionTransition}
              className="hero-gate-art hero-gate-right pointer-events-none absolute bottom-[-5.5vh] right-[-46vw] z-10 block h-[86vh] min-h-0 origin-right md:right-[-19vw] md:h-[90vh] md:max-h-[960px] md:min-h-[640px] lg:right-[-11vw] xl:right-[-6vw] 2xl:right-[-1vw]"
              style={{ transformOrigin: "right bottom" }}
            >
              <Image
                src="/images/hero-gate-right-clean.png"
                alt=""
                width={1024}
                height={1536}
                loading="eager"
                sizes="(min-width: 1536px) 640px, (min-width: 1024px) 560px, (min-width: 768px) 45vw, 30vw"
                className="h-full w-auto object-contain object-right-bottom"
              />
            </motion.div>
          </>
        )}

        <div className="hero-content relative z-30 mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6 pb-[25vh] pt-[22vh] text-center sm:px-8 sm:pb-[25vh] md:pt-[21vh] lg:pb-[26vh]">
          <div key={heroRevealKey} className="hero-copy max-w-4xl">
            <motion.p
              className="type-section-eyebrow"
              {...heroTextRevealMotion(heroRevealTiming.delays.eyebrow)}
            >
              We&rsquo;re Getting Married
            </motion.p>
            <motion.h1 className="rose-gold-foil hero-title type-hero-title mt-8" {...heroNamesRevealMotion}>
              <span className="hero-name">Sumaya</span>
              <span className="luxe-ampersand">&amp;</span>
              <span className="hero-name">Aditya</span>
            </motion.h1>
            <div className="mx-auto mt-10 flex w-full max-w-[260px] items-center justify-center gap-3">
              <motion.span
                className="h-px flex-1 bg-[var(--color-divider)] opacity-90"
                style={{ transformOrigin: "right center" }}
                {...heroDividerLineMotion}
              />
              <motion.span
                className="h-1.5 w-1.5 rotate-45 bg-[var(--color-divider)] opacity-90"
                {...heroDividerMarkMotion}
              />
              <motion.span
                className="h-px flex-1 bg-[var(--color-divider)] opacity-90"
                style={{ transformOrigin: "left center" }}
                {...heroDividerLineMotion}
              />
            </div>
            <motion.p
              className="type-meta mx-auto mt-9 max-w-[330px] sm:max-w-none"
              {...heroTextRevealMotion(heroRevealTiming.delays.dateVenue)}
            >
              <span className="block sm:inline">01 November 2026</span>
              <span className="mx-2 hidden text-[var(--color-divider)] opacity-90 sm:inline">&middot;</span>
              <span className="mt-3 block sm:mt-0 sm:inline">Caversham House, Swan Valley</span>
            </motion.p>
            <motion.p
              className="type-meta mt-7"
              {...heroTextRevealMotion(heroRevealTiming.delays.timeLocation)}
            >
              <span className="block sm:inline">4:00 PM Ceremony</span>
              <span className="mx-2 hidden text-[var(--color-divider)] opacity-90 sm:inline">&middot;</span>
              <span className="mt-2 block sm:mt-0 sm:inline">Garden House</span>
            </motion.p>
            <div className="hero-cta-group">
              <motion.div
                className="hero-cta-reveal"
                {...heroTextRevealMotion(
                  heroRevealTiming.delays.cta,
                  heroRevealTiming.ctaY,
                  heroRevealTiming.ctaDuration,
                )}
              >
                <a
                  href={googleCalendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Add Sumaya and Aditya's wedding to Google Calendar"
                  className="hero-primary-cta primary-cta type-button"
                >
                  <CalendarPlus className="h-4 w-4" />
                  SAVE THE DATE
                </a>
              </motion.div>
            </div>
            <motion.a
              href="#details"
              className="mobile-scroll-cue sm:hidden"
              aria-label="Scroll to wedding details"
              {...heroTextRevealMotion(
                heroRevealTiming.delays.scrollCue,
                0,
                heroRevealTiming.textDuration * 0.78,
              )}
            >
              <span />
            </motion.a>
          </div>
        </div>
        </div>
      </section>

      <section className="editorial-panel mobile-invite-quote bg-[#fbf7f2] md:px-6 md:py-24">
        <motion.div {...cinematicRevealMotion(0, 18, 1.08, 0.38)} className="mx-auto max-w-[600px] text-center">
          <motion.blockquote className="type-quote" {...cinematicRevealMotion(0.08, 14, 1.08, 0.46)}>
            &ldquo;Whatever our souls are made of, his and mine are the same.&rdquo;
          </motion.blockquote>
          <motion.p className="type-quote-attribution type-section-eyebrow mt-6" {...cinematicRevealMotion(0.28, 10, 0.88, 0.5)}>
            &mdash; Emily Bront&euml;
          </motion.p>
        </motion.div>
      </section>

      <section id="note" className="editorial-panel mobile-invite-note bg-[#fbf7f2]">
        <motion.div {...cinematicRevealMotion(0, 16, 1.0, 0.34)} className="mobile-invite-note-inner">
          <motion.h2 className="mobile-note-title" {...cinematicRevealMotion(0, 10, 0.86, 0.48)}>
            A Note from Us
          </motion.h2>
          <motion.div className="mobile-note-body" {...cinematicRevealMotion(0.16, 14, 0.96, 0.44)}>
            <p>
              We&rsquo;re so grateful to celebrate this next chapter surrounded by the people who have shaped our lives in
              meaningful ways.
            </p>
            <p>
              From the very beginning, we imagined a day that felt warm, romantic, and deeply personal &mdash; a
              celebration where everyone could slow down, enjoy the atmosphere, and simply be present with us.
            </p>
            <p>
              Caversham House felt like the perfect setting for that vision: timeless gardens, music, and an evening
              shared together in one beautiful place.
            </p>
            <p>
              Thank you for being part of something so special to us. We truly cannot wait to celebrate with you.
            </p>
          </motion.div>
          <motion.div
            className="mobile-note-signature"
            aria-label="With love, Sumaya and Aditya"
            {...cinematicRevealMotion(0.32, 10, 0.86, 0.42)}
          >
            <p>With love,</p>
            <p>Sumaya &amp; Aditya</p>
          </motion.div>
        </motion.div>
      </section>

      <SoftSection
        id="details"
        panelStep="01 / 06"
        panelLabel="Details"
        backgroundLayer={
          canPlayCelebrationVideo ? (
            <>
              <video
                className="celebration-video-layer pointer-events-none absolute inset-0 h-full w-full object-cover"
                src="/videos/celebration-garden-loop-soft-loop.mp4"
                poster="/videos/celebration-garden-poster.jpg"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-hidden="true"
              />
              <div className="celebration-video-wash pointer-events-none absolute inset-0" aria-hidden="true" />
            </>
          ) : null
        }
      >
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <motion.p className="heading-micro mb-3" {...cinematicRevealMotion(0, 10, 0.86, 0.5)}>
            The celebration
          </motion.p>
          <motion.h2 className="heading-primary" {...cinematicRevealMotion(0.14, 18, 1.02, 0.46)}>
            From garden vows
            <br />
            to evening glow
          </motion.h2>
          <motion.p className="heading-copy mt-4" {...cinematicRevealMotion(0.3, 14, 0.92, 0.44)}>
            Our day has been designed to feel romantic, relaxed, and full of warmth &mdash; unfolding across Caversham House.
          </motion.p>
        </div>
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {[
            {
              icon: Flower2,
              title: "Garden Ceremony",
              text: "Set among the greenery at Garden House.",
            },
            {
              icon: Utensils,
              title: "Dinner at Main House",
              text: "A sit-down reception and time shared around the table.",
            },
            {
              icon: Music,
              title: "Celebration",
              text: "Music and dancing as the evening unfolds.",
            },
          ].map((card, index) => (
            <motion.div
              key={card.title}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.24 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.9,
                delay: shouldReduceMotion ? 0 : 0.28 + index * 0.12,
                ease: cinematicRevealEase,
              }}
              className="mobile-invite-card card-luxe card-luxe-text card-luxe-hover px-8 py-10"
            >
              <card.icon className="mb-7 h-6 w-6 text-[var(--color-divider)]" />
              <h3 className="type-card-title">{card.title}</h3>
              <p className="type-card-body mt-4">{card.text}</p>
            </motion.div>
          ))}
        </div>
      </SoftSection>

      <SoftSection
        id="dress-code"
        className="bg-[linear-gradient(180deg,_#fbf7f2_0%,_rgba(248,235,230,0.36)_50%,_#fbf7f2_100%)]"
        contentClassName="mx-auto max-w-6xl"
        panelStep="02 / 06"
        panelLabel="Dress Code"
      >
        <div className="dress-code-desktop-flow">
          <motion.div {...dressRevealMotion(0, 10)} className="mx-auto max-w-3xl text-center">
            <p className="heading-micro mb-4">
              {dressCode.eyebrow}
            </p>
            <h2 className="heading-primary">
              {dressCode.title}
            </h2>
            <div className="mx-auto mt-7 flex w-full max-w-[280px] items-center justify-center gap-3">
              <span className="h-px flex-1 bg-[var(--color-divider)] opacity-90" />
              <span className="h-1.5 w-1.5 rotate-45 bg-[var(--color-divider)] opacity-90" />
              <span className="h-px flex-1 bg-[var(--color-divider)] opacity-90" />
            </div>
            <p className="heading-copy mx-auto mt-8 max-w-[600px]">
              {dressCode.description}
            </p>
          </motion.div>

          <motion.article
            {...dressRevealMotion(0.04, 10)}
            className="mt-16 pb-2"
          >
            <div className="mx-auto max-w-3xl text-center">
              <h3 className="heading-secondary">Pastel Formal</h3>
              <div className="type-card-body mx-auto mt-6 max-w-[600px] space-y-3">
                {dressCode.pastelFormalCopy.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>

              <div className="swatchRow mx-auto mt-10" style={swatchRowStyle}>
                {dressCodePastelPalette.map((swatch) => (
                  <Swatch
                    key={swatch.id}
                    swatch={swatch}
                  />
                ))}
              </div>
            </div>

          </motion.article>

          <motion.div {...dressRevealMotion(0.04, 8)} className="mx-auto mt-10 flex w-full max-w-[86px] items-center justify-center gap-2">
            <span className="h-px flex-1 bg-[var(--color-divider)] opacity-90" />
            <span className="h-1 w-1 rotate-45 bg-[var(--color-divider)] opacity-90" />
            <span className="h-px flex-1 bg-[var(--color-divider)] opacity-90" />
          </motion.div>

          <motion.article {...dressRevealMotion(0.05, 8)} className="mt-8">
            <div className="mx-auto max-w-3xl text-center">
              <h3 className="heading-secondary">Classic Formal</h3>
              <div className="type-card-body mx-auto mt-5 max-w-[600px] space-y-2">
                {dressCode.classicFormalCopy.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>

              <div className="swatchRow mx-auto mt-7" style={swatchRowStyle}>
                {dressCodeClassicPalette.map((swatch) => (
                  <Swatch
                    key={swatch.id}
                    swatch={swatch}
                  />
                ))}
              </div>
            </div>

          </motion.article>

          <motion.p
            {...dressRevealMotion(0.06, 6)}
            className="dress-palette-guidance luxe-serif-detail mx-auto mt-8 max-w-[34ch] text-center"
          >
            Soft romantic neutrals inspired by the floral palette.
          </motion.p>

          <motion.div
            {...dressRevealMotion(0.08, 8)}
            className="mobile-editorial-callout mx-auto mt-10 max-w-2xl text-center"
          >
            <h3 className="type-card-title">A gentle note</h3>
            <p className="type-card-body mx-auto mt-3 max-w-[600px]">
              With love, please leave white, ivory, cream, and bridal tones for the bride.
            </p>

            <h3 className="type-card-title mt-7">Garden shoes</h3>
            <p className="type-card-body mx-auto mt-3 max-w-[600px]">
              For the gardens, block heels, wedges, flats, or comfortable dress shoes will feel best.
            </p>
          </motion.div>
        </div>

        <div className="dress-code-mobile-panels">
          <motion.div {...dressRevealMotion(0, 8)} className="dress-code-mobile-panel dress-code-mobile-panel-primary">
            <div className="dress-code-mobile-panel-inner">
              <p className="heading-micro">
                {dressCode.eyebrow}
              </p>
              <h2 className="heading-primary">
                {dressCode.title}
              </h2>
              <div className="mx-auto flex w-full max-w-[168px] items-center justify-center gap-2">
                <span className="h-px flex-1 bg-[var(--color-divider)] opacity-90" />
                <span className="h-1.5 w-1.5 rotate-45 bg-[var(--color-divider)] opacity-90" />
                <span className="h-px flex-1 bg-[var(--color-divider)] opacity-90" />
              </div>
              <p className="heading-copy">
                {dressCode.description}
              </p>

              <article className="dress-code-mobile-block">
                <h3 className="heading-secondary">Pastel Formal</h3>
                <div className="type-card-body">
                  {dressCode.pastelFormalCopy.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>

                <div className="swatchRow mx-auto" style={swatchRowStyle}>
                  {dressCodePastelPalette.map((swatch) => (
                    <Swatch
                      key={swatch.id}
                      swatch={swatch}
                    />
                  ))}
                </div>
              </article>
            </div>
          </motion.div>

          <motion.div {...dressRevealMotion(0.02, 8)} className="dress-code-mobile-panel dress-code-mobile-panel-classic">
            <div className="dress-code-mobile-panel-inner">
              <article className="dress-code-mobile-block">
                <h3 className="heading-secondary">Classic Formal</h3>
                <div className="type-card-body">
                  {dressCode.classicFormalCopy.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>

                <div className="swatchRow mx-auto" style={swatchRowStyle}>
                  {dressCodeClassicPalette.map((swatch) => (
                    <Swatch
                      key={swatch.id}
                      swatch={swatch}
                    />
                  ))}
                </div>
              </article>

              <p className="dress-palette-guidance luxe-serif-detail mx-auto max-w-[34ch] text-center">
                Soft romantic neutrals inspired by the floral palette.
              </p>

              <div className="mobile-editorial-callout dress-code-mobile-etiquette mx-auto max-w-2xl text-center">
                <h3 className="type-card-title">A gentle note</h3>
                <p className="type-card-body mx-auto max-w-[600px]">
                  With love, please leave white, ivory, cream, and bridal tones for the bride.
                </p>

                <h3 className="type-card-title">Garden shoes</h3>
                <p className="type-card-body mx-auto max-w-[600px]">
                  For the gardens, block heels, wedges, flats, or comfortable dress shoes will feel best.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </SoftSection>

      <SoftSection id="itinerary" contentClassName="mx-auto max-w-5xl" panelStep="03 / 06" panelLabel="Itinerary">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <motion.h2 className="heading-primary" {...cinematicRevealMotion(0, 16, 1.0, 0.46)}>
            Wedding itinerary
          </motion.h2>
          <motion.div
            className="mx-auto my-6 flex w-full max-w-[128px] items-center justify-center gap-2.5"
            {...cinematicDividerMotion(0.18)}
          >
            <span className="h-px flex-1 bg-[var(--color-divider)] opacity-90" />
            <span className="font-serif text-[20px] leading-none text-[var(--color-divider)] opacity-90">❦</span>
            <span className="h-px flex-1 bg-[var(--color-divider)] opacity-90" />
          </motion.div>
          <motion.p className="heading-copy mx-auto max-w-[560px]" {...cinematicRevealMotion(0.32, 14, 0.92, 0.42)}>
            The final schedule may be refined closer to the day, but this is the planned flow for guests.
          </motion.p>
          <motion.p className="type-editorial-note mt-7" {...cinematicRevealMotion(0.48, 10, 0.82, 0.4)}>
            A gentle unfolding of our day
          </motion.p>
        </div>
        <div className="itinerary-list relative mx-auto grid max-w-[900px] gap-0">
          <div
            aria-hidden="true"
            className="itinerary-line pointer-events-none absolute bottom-6 left-[calc(68px+0.75rem+12px)] top-4 w-px md:left-[calc(130px+1.5rem+20px)]"
            style={{ background: "var(--color-divider-line)" }}
          />
          {itinerary.map((item, index) => (
            <motion.div
              key={item.title}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.86,
                delay: shouldReduceMotion ? 0 : index * 0.11,
                ease: cinematicRevealEase,
              }}
              className="itinerary-item grid grid-cols-[68px_24px_1fr] gap-x-3 md:grid-cols-[130px_40px_1fr] md:gap-x-6"
            >
              <div className="type-timeline-time pt-4 text-right">
                {item.time}
              </div>
              <div className="itinerary-marker relative flex justify-center pt-[1.05rem]">
                <div className="relative z-10 flex h-[18px] w-[18px] items-center justify-center rounded-full border border-[var(--color-divider)] bg-[#fbf7f2] shadow-[0_0_0_5px_rgba(203,182,175,0.16)]">
                  <span className="h-[7px] w-[7px] rounded-full bg-[var(--color-divider)]" />
                </div>
              </div>
              <div className="itinerary-content pb-7">
                <div className="pb-5">
                  <div className="flex items-center gap-4">
                    <ItineraryIcon title={item.title} />
                    <h3 className="type-timeline-title">
                      {item.title}
                    </h3>
                  </div>
                  <p className="type-card-body mt-4 max-w-2xl">
                    {item.detail}
                  </p>
                </div>
                {index < itinerary.length - 1 && (
                  <div className="pt-1">
                    <div
                      className="h-px w-full"
                      style={{ background: "rgba(203, 182, 175, 0.28)" }}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
        <motion.div
          className="mx-auto mt-10 flex w-full max-w-[260px] items-center justify-center gap-3"
          {...cinematicDividerMotion(0.08)}
        >
          <span className="h-px flex-1 bg-[var(--color-divider)] opacity-90" />
          <span className="h-2 w-2 rotate-45 rounded-[1px] bg-[var(--color-divider)] opacity-90" />
          <span className="h-px flex-1 bg-[var(--color-divider)] opacity-90" />
        </motion.div>
      </SoftSection>

      <SoftSection
        id="venue"
        className="mb-20 mt-24 bg-[linear-gradient(180deg,_#fbf7f2_0%,_rgba(248,235,230,0.46)_48%,_#fbf7f2_100%)] md:mb-24 md:mt-28"
        panelStep="04 / 06"
        panelLabel="Venue"
      >
        <div className="venue-desktop-flow">
          <motion.div
            className="mx-auto mb-14 max-w-3xl text-center md:mb-16"
            {...cinematicRevealMotion(0, 18, 0.98, 0.4)}
          >
            <p className="heading-micro mb-3">VENUE</p>
            <h2 className="heading-primary">Caversham House</h2>
            <motion.div className="mx-auto my-4 flex w-full max-w-[104px] items-center justify-center gap-2" {...cinematicDividerMotion(0.18)}>
              <span className="h-px flex-1 bg-[var(--color-divider)] opacity-90" />
              <span className="h-1.5 w-1.5 rotate-45 bg-[var(--color-divider)] opacity-90" />
              <span className="h-px flex-1 bg-[var(--color-divider)] opacity-90" />
            </motion.div>
            <p className="heading-copy mx-auto max-w-[560px]">
              A Swan Valley garden setting with a romantic ceremony at Garden House and a reception at Main House.
            </p>
            <p className="type-card-body mx-auto mt-3 max-w-[520px]">
              A soft garden setting for the day to unfold slowly, warmly, and beautifully.
            </p>
          </motion.div>

          <motion.div
            className="grid gap-8 md:grid-cols-[1.05fr_0.95fr] md:items-stretch md:gap-10"
            {...cinematicRevealMotion(0.22, 18, 0.95, 0.22)}
          >
            <div className="relative isolate h-full">
              <VenueCarousel />
            </div>
            <div className="mx-auto flex h-full w-full max-w-[480px] md:max-w-none">
              <div className="card-luxe card-luxe-text flex h-full w-full flex-col justify-center p-8 md:p-9">
                <h3 className="type-card-title">Getting There &amp; Parking</h3>
                <div className="type-card-body mt-5 space-y-4">
                  <p>
                    Caversham House
                    <br />
                    Swan Valley, Perth
                  </p>
                  <div className="h-px w-full bg-[var(--color-divider)] opacity-90" />
                  <p>
                    Parking is available at the Main House car park. Please follow signage upon arrival.
                  </p>
                  <p>
                    We recommend arriving 20&ndash;30 minutes before the ceremony to allow time to settle into the
                    gardens.
                  </p>
                </div>
                <div className="venue-action-group">
                  <a
                    className="venue-action venue-action-primary"
                    href={googleDirectionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin className="h-4 w-4" />
                    Open Maps
                  </a>
                  <a
                    className="venue-action venue-action-secondary"
                    href={googleVenueMapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin className="h-4 w-4" />
                    View Map
                  </a>
                  <button
                    className="venue-action venue-action-secondary"
                    type="button"
                    onClick={handleCopyVenueAddress}
                  >
                    {hasCopiedVenueAddress ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {hasCopiedVenueAddress ? "Copied" : "Copy Address"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

        </div>

        <div className="venue-mobile-panels">
          <motion.section className="venue-mobile-panel venue-mobile-panel-intro" {...cinematicRevealMotion(0, 14, 0.95, 0.18)}>
            <div className="venue-mobile-panel-inner">
              <div className="mx-auto max-w-3xl text-center">
                <p className="heading-micro">VENUE</p>
                <h2 className="heading-primary">Caversham House</h2>
                <div className="mx-auto flex w-full max-w-[104px] items-center justify-center gap-2">
                  <span className="h-px flex-1 bg-[var(--color-divider)] opacity-90" />
                  <span className="h-1.5 w-1.5 rotate-45 bg-[var(--color-divider)] opacity-90" />
                  <span className="h-px flex-1 bg-[var(--color-divider)] opacity-90" />
                </div>
                <p className="heading-copy mx-auto max-w-[560px]">
                  A Swan Valley garden setting with a romantic ceremony at Garden House and a reception at Main House.
                </p>
                <p className="type-card-body mx-auto max-w-[520px]">
                  A soft garden setting for the day to unfold slowly, warmly, and beautifully.
                </p>
              </div>

              <div className="venue-mobile-carousel relative isolate">
                <VenueCarousel />
              </div>
            </div>
          </motion.section>

          <motion.section
            id="venue-parking"
            className="venue-mobile-panel venue-mobile-panel-practical"
            {...cinematicRevealMotion(0, 14, 0.95, 0.18)}
          >
            <div className="venue-mobile-panel-inner">
              <div className="card-luxe card-luxe-text venue-mobile-info-card">
                <h3 className="type-card-title">Getting There &amp; Parking</h3>
                <div className="type-card-body">
                  <p>
                    Caversham House
                    <br />
                    Swan Valley, Perth
                  </p>
                  <div className="h-px w-full bg-[var(--color-divider)] opacity-90" />
                  <p>
                    Parking is available at the Main House car park. Please follow signage upon arrival.
                  </p>
                  <p>
                    We recommend arriving 20&ndash;30 minutes before the ceremony to allow time to settle into the
                    gardens.
                  </p>
                </div>
                <div className="venue-action-group">
                  <a
                    className="venue-action venue-action-primary"
                    href={googleDirectionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin className="h-4 w-4" />
                    Open Maps
                  </a>
                  <a
                    className="venue-action venue-action-secondary"
                    href={googleVenueMapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin className="h-4 w-4" />
                    View Map
                  </a>
                  <button
                    className="venue-action venue-action-secondary"
                    type="button"
                    onClick={handleCopyVenueAddress}
                  >
                    {hasCopiedVenueAddress ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {hasCopiedVenueAddress ? "Copied" : "Copy Address"}
                  </button>
                </div>
              </div>
            </div>
          </motion.section>
        </div>
      </SoftSection>

      <SoftSection id="rsvp" contentClassName="mx-auto max-w-4xl" panelStep="05 / 06" panelLabel="RSVP">
        <motion.div
          className="card-luxe card-luxe-dark px-5 py-10 md:px-10 md:py-12"
          {...cinematicRevealMotion(0, 18, 1.0, 0.28)}
        >
          <div className="mx-auto max-w-3xl text-center">
            <motion.p className="heading-micro heading-micro-light mb-3" {...cinematicRevealMotion(0.08, 10, 0.86, 0.5)}>
              RSVP
            </motion.p>
            <motion.h2 className="heading-primary" {...cinematicRevealMotion(0.2, 16, 0.98, 0.46)}>
              We hope you can celebrate with us
            </motion.h2>
            <motion.p className="heading-copy mt-5" {...cinematicRevealMotion(0.34, 12, 0.9, 0.42)}>
              Your formal invitation will include a private RSVP link created just for you. Please use that link so we
              can recognise your invitation and save your response to the right guest record.
            </motion.p>
          </div>

          <motion.div
            className="card-luxe card-luxe-text mt-10 p-6 text-center text-[var(--color-body)] md:p-8"
            {...cinematicRevealMotion(0.48, 14, 0.9, 0.3)}
          >
            <p className="type-card-body mx-auto max-w-2xl">
              There is no public name-search RSVP form, so your private link is the most reliable way for us to prefill
              your invitation details and ask only the questions relevant to you.
            </p>
            <div className="rsvp-mobile-steps mt-6 md:hidden">
              <div>
                <span>1</span>
                <strong>Open private link</strong>
              </div>
              <div>
                <span>2</span>
                <strong>Confirm details</strong>
              </div>
            </div>
            <div className="mx-auto mt-6 h-px w-24 bg-[var(--color-divider)] opacity-90" />
            <p className="type-card-body mx-auto mt-6 max-w-xl">
              If you cannot find your link, please message Sumaya or Aditya and we can send it again.
            </p>
          </motion.div>

          <div
            className="hidden"
          >
            <div className="grid gap-6">
              <label className="grid gap-2">
                <span className="type-section-eyebrow">Guest name</span>
                <input
                  type="text"
                  name="guestName"
                  value={guestName}
                  onChange={(event) => setGuestName(event.target.value)}
                  readOnly={Boolean(guestInviteToken && guestName)}
                  placeholder="Your full name"
                  className="min-h-12 rounded-2xl border border-[var(--color-border-blush)] bg-white px-4 text-[var(--color-body)] outline-none transition placeholder:text-[var(--color-label)] read-only:bg-[#fbf7f2] focus:border-[var(--color-heading)]"
                />
                {guestLookupMessage && (
                  <span className="type-helper">{guestLookupMessage}</span>
                )}
              </label>

              <div className="grid gap-5 md:grid-cols-[1.12fr_0.88fr]">
                <fieldset className="rounded-2xl border border-[var(--color-border-blush)] bg-white/70 p-5">
                  <legend className="type-section-eyebrow px-1">
                    Will you be joining us for the ceremony?
                  </legend>
                  <div className="type-card-body mt-4 grid gap-3">
                    {["Yes", "No"].map((option) => (
                      <label key={option} className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="attendingCeremony"
                          value={option.toLowerCase()}
                          checked={attendingCeremony === option.toLowerCase()}
                          onChange={() => handleCeremonyAttendanceChange(option.toLowerCase())}
                          className="accent-[var(--color-heading)]"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="rounded-2xl border border-[var(--color-border-blush)] bg-white/70 p-5">
                  <legend className="type-section-eyebrow px-1">
                    Will you be joining us for the reception?
                  </legend>
                  <div className="type-card-body mt-4 grid gap-3">
                    {["Yes", "No"].map((option) => (
                      <label key={option} className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="attendingReception"
                          value={option.toLowerCase()}
                          checked={attendingReception === option.toLowerCase()}
                          onChange={() => setAttendingReception(option.toLowerCase())}
                          className="accent-[var(--color-heading)]"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>

              <fieldset className="rounded-2xl border border-[var(--color-border-blush)] bg-white/70 p-5">
                <legend className="type-section-eyebrow px-1">
                  Will you be bringing a +1?
                </legend>
                <div className="type-card-body mt-4 grid gap-3">
                  {["Yes", "No"].map((option) => (
                    <label key={option} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="bringingPlusOne"
                        value={option.toLowerCase()}
                        checked={bringingPlusOne === option.toLowerCase()}
                        onChange={() => handlePlusOneChange(option.toLowerCase())}
                        className="accent-[var(--color-heading)]"
                      />
                      {option}
                    </label>
                  ))}
                </div>

                {bringingPlusOne === "yes" && (
                  <label className="mt-5 grid gap-2 rounded-[18px] border border-[var(--color-border-blush)] bg-[#fffaf7]/70 p-5">
                    <span className="type-section-eyebrow">
                      +1 full name
                    </span>
                    <input
                      type="text"
                      name="plusOneName"
                      value={plusOneName}
                      onChange={(event) => setPlusOneName(event.target.value)}
                      placeholder="Their full name"
                      className="min-h-12 rounded-2xl border border-[var(--color-border-blush)] bg-white/85 px-4 text-[var(--color-body)] outline-none transition placeholder:text-[var(--color-label)] focus:border-[var(--color-heading)]"
                    />
                    <span className="type-helper mt-2">
                      This helps us keep the guest list and seating plan beautifully organised.
                    </span>
                  </label>
                )}
              </fieldset>

              <label className="grid gap-2">
                <span className="type-section-eyebrow">
                  Dietary requirements
                </span>
                <textarea
                  name="dietaryRequirements"
                  rows={3}
                  placeholder="Please let us know about any dietary requirements or allergies"
                  className="rounded-2xl border border-[var(--color-border-blush)] bg-white px-4 py-3 text-[var(--color-body)] outline-none transition placeholder:text-[var(--color-label)] focus:border-[var(--color-heading)]"
                />
              </label>

              <label className="grid gap-2">
                <span className="type-section-eyebrow">Song request</span>
                <input
                  type="text"
                  name="songRequest"
                  placeholder="A song you’d love to hear on the dance floor"
                  className="min-h-12 rounded-2xl border border-[var(--color-border-blush)] bg-white px-4 text-[var(--color-body)] outline-none transition placeholder:text-[var(--color-label)] focus:border-[var(--color-heading)]"
                />
              </label>

              {rsvpSubmitMessage && (
                <div
                  className={`type-card-body rounded-2xl border px-5 py-4 ${
                    rsvpSubmitStatus === "success"
                      ? "border-[rgba(203,182,175,0.5)] bg-[var(--color-ivory)] text-[var(--color-body)]"
                      : "border-[var(--color-border-blush)] bg-[rgba(255,245,242,0.9)] text-[var(--color-heading)]"
                  }`}
                >
                  {rsvpSubmitMessage}
                </div>
              )}

              <div className="flex flex-col gap-3 border-t border-[var(--color-border-blush)] pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="type-card-body">
                  Your response will be saved to our wedding RSVP list.
                </p>
                <button
                  type="submit"
                  disabled={rsvpSubmitStatus === "submitting"}
                  className="primary-cta type-button px-7 py-3 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {rsvpSubmitStatus === "submitting" ? "Saving..." : "Submit RSVP"}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </SoftSection>

      <SoftSection id="faq" contentClassName="mx-auto max-w-4xl" panelStep="06 / 06" panelLabel="FAQ">
        <SectionHeading
          eyebrow="Good to know"
          title="Guest FAQ"
          subtitle="A simple place for guests to quickly find the details without messaging you both separately."
        />
        <div className="faq-list grid gap-4">
          {faqs.map((item, index) => (
            <FaqItem key={item.question} item={item} index={index} />
          ))}
        </div>
      </SoftSection>

      <motion.footer
        id="site-footer"
        className="border-t border-[color:var(--color-divider-soft)] px-6 py-10 text-center"
        {...cinematicRevealMotion(0, 14, 1.02, 0.24)}
      >
        <motion.p className="type-card-title" {...cinematicRevealMotion(0.08, 10, 0.82, 0.48)}>
          Sumaya & Aditya
        </motion.p>
        <motion.p className="type-meta mt-2" {...cinematicRevealMotion(0.18, 8, 0.78, 0.48)}>
          01 November 2026 &middot; Perth
        </motion.p>
        <motion.div
          className="card-luxe-pill type-card-body mx-auto mt-6 flex max-w-md items-center justify-center gap-2 px-5 py-3"
          {...cinematicRevealMotion(0.28, 10, 0.82, 0.44)}
        >
          <Mail className="h-4 w-4" />
          Wedding website and RSVP system in progress
        </motion.div>
        <motion.div
          className="footer-utility-nav mt-8 flex items-center justify-center gap-5"
          {...cinematicRevealMotion(0.38, 8, 0.72, 0.4)}
        >
          <a href="/guest-list" className="type-nav text-[var(--color-label)] transition hover:text-[var(--color-heading)]">Guest List</a>
          <span className="text-[var(--color-divider-soft)]">&middot;</span>
          <a href="/inner-circle" className="type-nav text-[var(--color-label)] transition hover:text-[var(--color-heading)]">Inner Circle</a>
          <span className="text-[var(--color-divider-soft)]">&middot;</span>
          <a href="/private-planning" className="type-nav text-[var(--color-label)] transition hover:text-[var(--color-heading)]">Planning</a>
        </motion.div>
      </motion.footer>
    </main>
  );
}
