"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Calendar, MapPin, Heart, Clock, Music, Sparkles, Mail, ChevronDown, ChevronLeft, ChevronRight, CalendarPlus } from "lucide-react";

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

const faqs = [
  {
    question: "Where is the wedding?",
    answer: "Caversham House in the Swan Valley. The ceremony is planned for Garden House, followed by reception at Main House.",
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
    answer: "We would love our guests to dress in soft garden-party tones. Pastels, blush, champagne and sage tones, and elegant neutrals will fit beautifully.",
  },
  {
    question: "Can I bring a plus one?",
    answer: "Your invitation will show the names of everyone included. If you are unsure, please message us before submitting your RSVP.",
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

function SectionHeading({ eyebrow, title, subtitle }) {
  return (
    <div className="mx-auto mb-10 max-w-3xl text-center">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-stone-500">{eyebrow}</p>
      <h2 className="font-serif text-4xl text-stone-800 md:text-5xl">{title}</h2>
      {subtitle && <p className="mt-4 text-base leading-7 text-stone-600 md:text-lg">{subtitle}</p>}
    </div>
  );
}

function FaqItem({ item, index }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <div className="rounded-2xl border border-stone-200 bg-white/70 shadow-sm backdrop-blur">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
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
  const images = [
    { src: "/images/venue.jpg", alt: "Caversham House Gardens" },
    { src: "/images/venue2.jpg", alt: "Caversham House Main Building" },
  ];

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-stone-200 bg-white p-3 shadow-xl shadow-stone-300/30">
      <Image
        src={images[currentIndex].src}
        alt={images[currentIndex].alt}
        width={800}
        height={600}
        className="w-full rounded-[1.5rem] object-cover"
      />
      
      {/* Navigation Buttons */}
      <button
        onClick={goToPrevious}
        className="absolute left-5 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md transition hover:bg-white"
      >
        <ChevronLeft className="h-5 w-5 text-stone-900" />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-5 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md transition hover:bg-white"
      >
        <ChevronRight className="h-5 w-5 text-stone-900" />
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition ${
              index === currentIndex ? "w-6 bg-stone-900" : "w-2 bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function WeddingWebsiteStarter() {
  return (
    <main className="min-h-screen bg-[#fbf7f3] text-stone-800">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(232,196,184,0.55),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(210,184,153,0.42),_transparent_30%)]" />
        <div className="absolute left-1/2 top-8 -z-10 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-white/35 blur-3xl" />

        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div className="font-serif text-2xl tracking-wide text-stone-800">S & A</div>
          <div className="hidden items-center gap-8 text-sm text-stone-700 md:flex">
            <a href="#details" className="hover:text-stone-950">Details</a>
            <a href="#itinerary" className="hover:text-stone-950">Itinerary</a>
            <a href="#venue" className="hover:text-stone-950">Venue</a>
            <a href="#rsvp" className="rounded-full bg-stone-800 px-5 py-2 text-white shadow-sm hover:bg-stone-950">RSVP</a>
          </div>
        </nav>

        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-10 md:grid-cols-[1.05fr_0.95fr] md:pb-28 md:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {(() => {
              const googleCalendarUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Sumaya%20%26%20Aditya%E2%80%99s%20Wedding&dates=20261101T160000/20261101T230000&ctz=Australia%2FPerth&location=Caversham%20House%2C%20141%20Caversham%20Avenue%2C%20Caversham%20WA%206055%2C%20Australia&details=We%20can%E2%80%99t%20wait%20to%20celebrate%20with%20you.%20Ceremony%20begins%20at%204%3A00%20PM%20at%20Garden%20House%2C%20followed%20by%20reception%20at%20Main%20House";
              return (
                <a
                  href={googleCalendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Add Sumaya and Aditya's wedding to Google Calendar"
                  className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#eaded6] bg-[#fffaf7]/85 px-5 py-2 text-[12px] font-medium uppercase tracking-[0.28em] text-[#6e5b54] shadow-[0_8px_22px_rgba(90,65,50,0.08)] transition hover:border-[#d8b8ad] hover:bg-[#fff6f1]"
                >
                  <CalendarPlus className="h-4 w-4 text-[#b98278]" />
                  <span>Save the Date</span>
                </a>
              );
            })()}
            <h1 className="font-serif text-6xl leading-[0.95] tracking-tight text-stone-900 md:text-8xl">
                <span className="block text-[#b98d83]">Sumaya</span>
                <span className="block">& Aditya</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-stone-600">
              Join us as we celebrate our wedding day among the gardens of Caversham House.
            </p>

            <div className="mt-9 grid gap-4 text-sm text-stone-700 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/55 p-4 shadow-sm backdrop-blur">
                <Calendar className="h-5 w-5 text-[#b98d83]" />
                <div>
                  <p className="font-semibold text-stone-900">Sunday, 1 November 2026</p>
                  <p>4:00 PM ceremony</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/55 p-4 shadow-sm backdrop-blur">
                <MapPin className="h-5 w-5 text-[#b98d83]" />
                <div>
                  <p className="font-semibold text-stone-900">Caversham House</p>
                  <p>Swan Valley, Perth</p>
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <a href="#rsvp" className="rounded-full bg-stone-900 px-7 py-3 text-center text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-lg shadow-stone-300/40 transition hover:bg-stone-700">
                RSVP
              </a>
              <a href="#details" className="rounded-full border border-stone-300 bg-white/45 px-7 py-3 text-center text-sm font-semibold uppercase tracking-[0.18em] text-stone-800 backdrop-blur transition hover:bg-white">
                View Details
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.15 }}
            className="relative mx-auto w-full max-w-md"
          >
            <div className="absolute -left-8 top-10 h-32 w-32 rounded-full bg-[#ead3cd] blur-2xl" />
            <div className="absolute -bottom-8 -right-8 h-40 w-40 rounded-full bg-[#dac0a3] blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/75 bg-white/50 p-3 shadow-2xl shadow-stone-300/40 backdrop-blur">
              <div className="aspect-[4/5] rounded-[1.5rem] bg-gradient-to-br from-[#e7c9c0] via-[#f7efe9] to-[#c8aa82] p-8">
                <div className="flex h-full flex-col justify-between rounded-[1.25rem] border border-white/55 bg-white/25 p-6 text-center backdrop-blur-sm">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-stone-600">Wedding</p>
                    <p className="mt-4 font-serif text-5xl leading-none text-stone-900">01.11.26</p>
                  </div>
                  <div>
                    <Heart className="mx-auto mb-4 h-8 w-8 text-[#b98d83]" />
                    <p className="font-serif text-3xl text-stone-900">Garden romance</p>
                    <p className="mt-3 text-sm leading-6 text-stone-700">Replace this card with your favourite couple photo or a soft venue image.</p>
                  </div>
                  <p className="text-xs uppercase tracking-[0.3em] text-stone-600">Perth, Western Australia</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="details" className="px-6 py-20 md:py-28">
        <SectionHeading
          eyebrow="The celebration"
          title="A soft garden ceremony followed by an elegant reception"
          subtitle="Our day is being planned around romance, ease, family, good food, music, and a beautiful Swan Valley setting."
        />
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
          {[
            { icon: Calendar, title: "Date", text: "Sunday, 1 November 2026" },
            { icon: MapPin, title: "Location", text: "Caversham House, Swan Valley" },
            { icon: Music, title: "Mood", text: "Garden ceremony, dinner, drinks, and dancing" },
          ].map((card) => (
            <div key={card.title} className="rounded-[1.75rem] border border-stone-200 bg-white/70 p-7 shadow-sm backdrop-blur">
              <card.icon className="mb-5 h-6 w-6 text-[#b98d83]" />
              <h3 className="font-serif text-2xl text-[#b98d83]">{card.title}</h3>
              <p className="mt-3 leading-7 text-[#b98d83]">{card.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="itinerary" className="bg-[#f3ebe4] px-6 py-20 md:py-28">
        <SectionHeading
          eyebrow="Our day"
          title="Wedding itinerary"
          subtitle="The final schedule may be refined closer to the day, but this is the planned flow for guests."
        />
        <div className="mx-auto max-w-4xl">
          {itinerary.map((item, index) => (
            <div key={item.title} className="grid grid-cols-[90px_1fr] gap-5 md:grid-cols-[120px_1fr]">
              <div className="pt-1 text-right text-sm font-semibold text-stone-500">{item.time}</div>
              <div className="relative border-l border-stone-300 pb-10 pl-7 last:pb-0">
                <div className="absolute -left-[7px] top-1 h-3.5 w-3.5 rounded-full bg-[#b98d83] ring-4 ring-[#f3ebe4]" />
                <div className="rounded-2xl border border-white/70 bg-white/60 p-5 shadow-sm backdrop-blur">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-[#b98d83]" />
                    <h3 className="font-serif text-2xl text-stone-900">{item.title}</h3>
                  </div>
                  <p className="mt-3 leading-7 text-stone-600">{item.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="venue" className="px-6 py-20 md:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2">
          <VenueCarousel />
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-stone-500">Venue</p>
            <h2 className="font-serif text-4xl text-stone-900 md:text-5xl">Caversham House</h2>
            <p className="mt-5 text-lg leading-8 text-stone-600">
              A Swan Valley garden setting with a romantic ceremony at Garden House and a reception at Main House.
            </p>
            <div className="mt-8 rounded-3xl border border-stone-200 bg-white/70 p-6 shadow-sm backdrop-blur">
              <p className="font-semibold text-stone-900">Guest note</p>
              <p className="mt-2 leading-7 text-stone-600">
                Parking and arrival guidance will be added here once final guest information is ready.
              </p>
            </div>
          </div>
        </div>

        {/* Embedded Google Map */}
        <div className="mx-auto mt-12 max-w-6xl overflow-hidden rounded-[2rem] border border-stone-200 shadow-xl shadow-stone-300/30">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3384.9999!2d115.9905802!3d-31.8777983!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2a32b77920209d99%3A0xeb200b707ad3d95d!2sCaversham%20House%2C%20141%20Caversham%20Ave%2C%20Caversham%20WA%206055!5e0!3m2!1sen!2sau!4v1620000000000"
            width="100%"
            height="450"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>

      <section id="rsvp" className="bg-stone-900 px-6 py-20 text-white md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-stone-300">RSVP</p>
          <h2 className="font-serif text-4xl md:text-5xl">We hope you can celebrate with us</h2>
          <p className="mt-5 text-lg leading-8 text-stone-300">
            RSVP will open once formal invitations are sent. Each guest or household will receive a private RSVP link.
          </p>
          <div className="mt-10 rounded-[2rem] border border-white/15 bg-white/10 p-6 text-left shadow-2xl shadow-black/20 backdrop-blur">
            <label className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-300">Preview RSVP lookup</label>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                placeholder="Enter your name or invite code"
                className="min-h-12 flex-1 rounded-full border border-white/15 bg-white/95 px-5 text-stone-900 outline-none placeholder:text-stone-400"
              />
              <button className="rounded-full bg-[#e9cfc8] px-7 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-stone-900 transition hover:bg-white">
                Find Invite
              </button>
            </div>
            <p className="mt-4 text-sm leading-6 text-stone-300">
              This is the section we will connect to the SQL database in the next phase.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 md:py-28">
        <SectionHeading
          eyebrow="Good to know"
          title="Guest FAQ"
          subtitle="A few thoughtful details to help you arrive with ease and enjoy the celebration fully."
        />
        <div className="mx-auto grid max-w-4xl gap-4">
          {faqs.map((item, index) => (
            <FaqItem key={item.question} item={item} index={index} />
          ))}
        </div>
      </section>

      <footer className="border-t border-stone-200 px-6 py-10 text-center">
        <p className="font-serif text-3xl text-stone-900">Sumaya & Aditya</p>
        <p className="mt-2 text-sm uppercase tracking-[0.25em] text-stone-500">01 November 2026 · Perth</p>
        <div className="mx-auto mt-6 flex max-w-md items-center justify-center gap-2 rounded-full border border-stone-200 bg-white/60 px-5 py-3 text-sm text-stone-600">
          <Mail className="h-4 w-4" />
          Wedding website and RSVP system in progress
        </div>
      </footer>
    </main>
  );
}
