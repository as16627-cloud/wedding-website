"use client";

import Image from "next/image";
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
  { href: "#lookbooks", label: "Lookbooks" },
  { href: "#contact", label: "Contact" },
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

const lookbooks: LookbookCategory[] = [
  {
    id: "bridal-party",
    label: "Bridal Party",
    brief: "Soft, romantic, garden-formal dressing in blush, champagne, sage, powder blue, nude, and dusty lavender tones.",
    weLove: "Flowing fabrics, soft silhouettes, romantic details, subtle texture, and movement.",
    avoid: "Neon colours, loud prints, overly casual fabrics, or anything that clashes with the soft garden palette.",
    comfort: "Choose pieces that move easily through garden paths, photos, hugs, dinner, and dancing.",
    palette: [
      { name: "Blush", hex: "#EBC8C4" },
      { name: "Champagne", hex: "#E7D4B8" },
      { name: "Soft sage", hex: "#B9C7AA" },
      { name: "Powder blue", hex: "#B9CBDD" },
      { name: "Dusty lavender", hex: "#C9B7D6" },
      { name: "Nude", hex: "#D9BDAE" },
    ],
    guide: {
      eyebrow: "BRIDAL PARTY MORNING GUIDE",
      title: "Getting Ready Lookbook",
      intro: "A soft reference for robes, jewellery, hair, makeup, nails, footwear, and morning-prep details.",
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
    images: [
      {
        src: "/images/dress-code/pastel-formal-main.jpg",
        title: "Pastel garden formal",
        caption: "The soft tonal direction for romantic bridal-party styling.",
        why: "It keeps the palette airy, elegant, and cohesive without feeling too matched.",
      },
      {
        src: "/images/dress-code/pastel-formal-lavender.jpg",
        title: "Dusty lavender",
        caption: "A gentle pastel option with a romantic garden feel.",
        why: "The tone photographs softly beside blush, sage, champagne, and ivory.",
      },
      {
        src: "/images/dress-code/pastel-formal-saree.jpg",
        title: "Soft formal drape",
        caption: "Elegant movement and fabric that feels occasion-ready.",
        why: "Flow and texture make the look feel special while staying graceful.",
      },
    ],
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
    images: [
      {
        src: "/images/dress-code/classic-formal-navy.jpg",
        title: "Refined navy",
        caption: "A polished groom-inspired tone that feels formal without being heavy.",
        why: "Navy brings structure and depth while still sitting beautifully beside blush and ivory.",
      },
      {
        src: "/images/dress-code/classic-formal-charcoal.jpg",
        title: "Classic charcoal",
        caption: "Quiet, timeless tailoring for a formal garden setting.",
        why: "Charcoal is elegant, versatile, and easy to coordinate with soft accents.",
      },
      {
        src: "/images/dress-code/classic-formal-black.jpg",
        title: "Black formal",
        caption: "A crisp, classic option for a polished evening feel.",
        why: "It keeps the look elevated and timeless when styled cleanly.",
      },
      {
        src: "/images/dress-code/classic-formal-beige.jpg",
        title: "Warm beige",
        caption: "A softer tailoring option for daytime garden romance.",
        why: "Warm neutrals lighten the overall palette without feeling casual.",
      },
    ],
  },
  {
    id: "family-inner-circle",
    label: "Family / Inner Circle",
    brief: "Elegant, polished, and cohesive with the garden setting. Soft neutrals, pastels, and classic formal tones are all welcome.",
    weLove: "Outfits that feel timeless, comfortable, and photo-ready.",
    avoid: "Overly bright neon colours or anything too casual.",
    comfort: "Choose an outfit you can sit, stand, walk, hug, and celebrate in comfortably.",
    palette: [
      { name: "Blush", hex: "#EBC8C4" },
      { name: "Rose beige", hex: "#D8B7AE" },
      { name: "Ivory", hex: "#FFF8F4" },
      { name: "Sage", hex: "#AEBE9E" },
      { name: "Navy", hex: "#1F2A44" },
      { name: "Charcoal", hex: "#4B4A49" },
    ],
    guide: {
      eyebrow: "GROOM FAMILY MORNING GUIDE",
      title: "Getting Ready Lookbook",
      intro: "A gentle family styling guide for coordinated tones, sarees, suit details, florals, jewellery, and relaxed photo moments.",
      notes: [
        { title: "Groom's mom attire", copy: "Please wear a saree in tones that complement the day. Blush, champagne, soft neutrals, or muted pastels are perfect." },
        { title: "Groom's mom styling", copy: "Elegant and timeless draping styles that feel comfortable and refined." },
        { title: "Groom's mom florals", copy: "A corsage will be provided on the day and added just before the ceremony." },
        { title: "Groom's mom jewellery", copy: "Gold, pearl, or soft-toned jewellery works beautifully." },
        { title: "Groom's sister attire", copy: "Please wear a saree that complements the overall palette. Soft blush, champagne, or neutral tones are ideal." },
        { title: "Groom's sister hair", copy: "Soft waves, a low bun, or a romantic styled look will suit the overall aesthetic." },
        { title: "Groom's sister makeup", copy: "Keep makeup soft and polished to match the overall aesthetic." },
        { title: "Groom's dad attire", copy: "A suit in navy or classic dark tones, aligned with the groom party." },
        { title: "Groom's dad florals", copy: "A boutonniere will be provided and placed just before the ceremony." },
        { title: "Groom's dad details", copy: "Tie or pocket square can incorporate blush or soft neutral accents." },
        { title: "Groom's dad footwear", copy: "Formal shoes, clean and polished." },
        { title: "Photo note", copy: "We will capture a few relaxed family moments during the morning and after the ceremony." },
      ],
      footer: "Dress in coordinated tones, be ready for photos when needed, keep it relaxed and comfortable, and enjoy the day together.",
    },
    images: [
      {
        src: "/images/dress-code/pastel-formal-main.jpg",
        title: "Soft mixed pastels",
        caption: "A cohesive family palette without needing everyone to match.",
        why: "It allows individuality while keeping photos calm and beautifully tied together.",
      },
      {
        src: "/images/dress-code/classic-formal-beige.jpg",
        title: "Warm neutral formal",
        caption: "A timeless neutral option that works well with the venue and garden.",
        why: "It feels polished, approachable, and easy to pair with rose-gold accents.",
      },
      {
        src: "/images/dress-code/classic-formal-navy.jpg",
        title: "Structured navy",
        caption: "A refined deeper tone for family and close helpers.",
        why: "It balances the softer palette with a little groom-side structure.",
      },
    ],
  },
  {
    id: "getting-ready",
    label: "Getting Ready",
    brief: "Soft, calm, pretty, and comfortable for the morning.",
    weLove: "Robes, pyjamas, slippers, soft neutral tones, blush accents, and pieces that photograph beautifully.",
    avoid: "Anything uncomfortable, overly busy, or difficult to change out of.",
    comfort: "Prioritise easy layers, gentle fabrics, and pieces that will not disturb hair or makeup.",
    palette: [
      { name: "Warm ivory", hex: "#FFF8F4" },
      { name: "Blush", hex: "#EBC8C4" },
      { name: "Champagne", hex: "#E7D4B8" },
      { name: "Soft taupe", hex: "#BBA9A0" },
      { name: "Sage", hex: "#B9C7AA" },
    ],
    images: [
      {
        src: "/images/venue-card.png",
        title: "Calm morning mood",
        caption: "Soft architectural light and quiet garden-house energy.",
        why: "The getting-ready feel should be pretty, calm, and unhurried.",
      },
      {
        src: "/images/dress-code/pastel-formal-saree.jpg",
        title: "Soft fabric detail",
        caption: "Gentle fabric, easy movement, and romantic texture.",
        why: "These details photograph beautifully in morning prep moments.",
      },
      {
        src: "/images/floral-fixed-top-right.png",
        title: "Blush floral accents",
        caption: "A soft floral reference for the morning palette.",
        why: "It keeps the styling connected to the overall garden romance mood.",
      },
    ],
  },
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

function LookbookGuideCard({
  guide,
  onOpen,
}: {
  guide: NonNullable<LookbookCategory["guide"]>;
  onOpen: () => void;
}) {
  const previewNotes = guide.notes.slice(0, 6);
  const hiddenNoteCount = guide.notes.length - previewNotes.length;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative overflow-hidden rounded-[1.75rem] border border-[#eaded6] bg-[#fffaf7] p-6 text-left shadow-[0_18px_40px_rgba(90,65,50,0.075)] transition duration-500 hover:-translate-y-1 sm:col-span-2"
    >
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_16%,rgba(235,200,196,0.42),transparent_28%),radial-gradient(circle_at_86%_10%,rgba(255,248,244,0.9),transparent_32%),linear-gradient(135deg,rgba(255,250,247,0.92),rgba(248,239,233,0.68))]" />
      <span className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full border border-[#e7cbc3]/70 bg-[#f4e3de]/42 blur-[1px] transition duration-700 group-hover:scale-105" />
      <span className="pointer-events-none absolute -bottom-16 -left-10 h-44 w-44 rounded-full border border-[#eaded6]/80 bg-[#fff2ec]/62" />
      <span className="relative block">
        <span className="heading-micro block">{guide.eyebrow}</span>
        <span className="mt-3 block font-serif text-[2.35rem] leading-none text-[#8f6a63] md:text-[3rem]">
          {guide.title}
        </span>
        <span className="mt-4 block max-w-2xl text-sm leading-6 text-[#6a5d55] md:text-base">
          {guide.intro}
        </span>

        <span className="mt-6 grid gap-3 sm:grid-cols-2">
          {previewNotes.map((note) => (
            <span key={note.title} className="rounded-2xl border border-[#eaded6]/78 bg-white/58 p-4">
              <span className="heading-micro block text-[9px]">{note.title}</span>
              <span className="mt-2 block text-sm leading-6 text-[#6a5d55]">{note.copy}</span>
            </span>
          ))}
        </span>

        <span className="mt-6 inline-flex rounded-full border border-[#dccbc3] bg-white/58 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8f6a63] transition group-hover:border-[#c9aaa0]">
          Open full guide{hiddenNoteCount > 0 ? ` + ${hiddenNoteCount} more` : ""}
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

  return (
    <>
      <PrivateSection id="lookbooks" contentClassName="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="STYLE NOTES"
          title="Lookbooks"
          copy="A little visual guide for the people standing closest to us. These are here to help everyone understand the overall mood, colours, and level of formality - not to make anyone feel boxed in."
        />

        <div className="mx-auto mb-8 flex max-w-4xl flex-wrap justify-center gap-2 rounded-[2rem] border border-[#eaded6] bg-[#fffaf7]/78 p-2 shadow-[0_12px_34px_rgba(90,65,50,0.045)]">
          {lookbooks.map((lookbook) => (
            <button
              key={lookbook.id}
              type="button"
              onClick={() => setActiveLookbookId(lookbook.id)}
              className={`min-h-10 rounded-full px-4 text-[11px] font-semibold uppercase tracking-[0.12em] transition ${
                activeLookbook.id === lookbook.id
                  ? "bg-[var(--color-navy)] text-[var(--color-cta-text)] shadow-[0_10px_24px_rgba(31,42,68,0.16)]"
                  : "text-[#7d6b62] hover:bg-white/78 hover:text-[#8f6a63]"
              }`}
            >
              {lookbook.label}
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
          <SoftCard className="lg:sticky lg:top-6">
            <p className="heading-micro mb-3">{activeLookbook.label}</p>
            <h3 className="heading-secondary">Style brief</h3>
            <p className="type-card-body mt-4">{activeLookbook.brief}</p>

            <div className="mt-6 flex flex-wrap gap-2">
              {activeLookbook.palette.map((tone) => (
                <span key={tone.name} className="inline-flex items-center gap-2 rounded-full border border-[#eaded6] bg-white/68 py-1.5 pl-2 pr-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#75675f]">
                  <span className="h-4 w-4 rounded-full border border-[#e3d1c9]" style={{ backgroundColor: tone.hex }} />
                  {tone.name}
                </span>
              ))}
            </div>

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

          <div className="grid gap-4 sm:grid-cols-2">
            {activeGuide && (
              <LookbookGuideCard
                guide={activeGuide}
                onOpen={() => setSelectedGuide({ guide: activeGuide, category: activeLookbook.label })}
              />
            )}

            <button
              type="button"
              onClick={() => setSelectedImage({ image: featureImage, category: activeLookbook.label })}
              className="group relative min-h-[28rem] overflow-hidden rounded-[1.75rem] border border-[#eaded6] bg-[#fffaf7] text-left shadow-[0_18px_40px_rgba(90,65,50,0.08)] transition duration-500 hover:-translate-y-1 sm:col-span-2"
            >
              <Image
                src={featureImage.src}
                alt={featureImage.title}
                fill
                sizes="(max-width: 768px) 100vw, 58vw"
                className="object-cover transition duration-700 group-hover:scale-[1.035]"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-[#3f302b]/44 via-transparent to-transparent" />
              <span className="absolute bottom-0 left-0 right-0 p-5 text-[#fff8f4]">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-85">Feature image</span>
                <span className="mt-2 block font-serif text-3xl leading-tight">{featureImage.title}</span>
                <span className="mt-2 block max-w-xl text-sm leading-6 opacity-90">{featureImage.caption}</span>
              </span>
            </button>

            {supportingImages.map((image) => (
              <button
                key={image.title}
                type="button"
                onClick={() => setSelectedImage({ image, category: activeLookbook.label })}
                className="group overflow-hidden rounded-[1.35rem] border border-[#eaded6] bg-[#fffaf7]/82 text-left shadow-[0_12px_30px_rgba(90,65,50,0.055)] transition duration-500 hover:-translate-y-1"
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
                  <span className="mt-2 block text-sm leading-6 text-[#6a5d55]">{image.caption}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </PrivateSection>

      {selectedGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3f302b]/64 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`${selectedGuide.guide.title} guide`}>
          <button
            type="button"
            aria-label="Close lookbook guide"
            className="absolute inset-0 cursor-default"
            onClick={() => setSelectedGuide(null)}
          />
          <div className="relative max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-[2rem] border border-[#eaded6] bg-[#fffaf7] shadow-[0_28px_80px_rgba(40,30,26,0.3)]">
            <button
              type="button"
              onClick={() => setSelectedGuide(null)}
              className="absolute right-4 top-4 z-10 rounded-full border border-[#eaded6] bg-[#fffaf7]/88 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3f302b] backdrop-blur transition hover:border-[#d8bd96]"
            >
              Close
            </button>
            <div className="max-h-[92vh] overflow-y-auto p-6 md:p-10">
              <p className="heading-micro mb-3">{selectedGuide.category}</p>
              <h3 className="heading-primary">{selectedGuide.guide.title}</h3>
              <p className="luxe-serif-detail mt-5 max-w-2xl text-[1.25rem]">{selectedGuide.guide.intro}</p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {selectedGuide.guide.notes.map((note) => (
                  <div key={note.title} className="rounded-2xl border border-[#eaded6] bg-white/62 p-5">
                    <p className="heading-micro mb-2">{note.title}</p>
                    <p className="type-card-body">{note.copy}</p>
                  </div>
                ))}
              </div>
              <p className="type-card-body mt-8 rounded-2xl border border-[#eaded6] bg-[#fbf3ef]/74 p-5">
                {selectedGuide.guide.footer}
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#3f302b]/64 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`${selectedImage.image.title} lookbook image`}>
          <button
            type="button"
            aria-label="Close lookbook image"
            className="absolute inset-0 cursor-default"
            onClick={() => setSelectedImage(null)}
          />
          <div className="relative max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-[#eaded6] bg-[#fffaf7] shadow-[0_28px_80px_rgba(40,30,26,0.3)]">
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute right-4 top-4 z-10 rounded-full border border-[#eaded6] bg-[#fffaf7]/88 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3f302b] backdrop-blur transition hover:border-[#d8bd96]"
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

      <LookbookMoodboard />

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
