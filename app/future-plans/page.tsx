import type { Metadata } from "next";

// Hidden registry/future funds page — do not link publicly until approved.
const contributionCards = [
  {
    title: "Honeymoon Memories",
    text: "For quiet escapes, beautiful views, and the first adventures of married life.",
  },
  {
    title: "Our Future Home",
    text: "For thoughtful touches as we continue creating a home that feels calm, warm, and us.",
  },
  {
    title: "Date Nights & Slow Dinners",
    text: "For the little rituals we love — beautiful meals, slow evenings, and time together.",
  },
  {
    title: "Anniversary Getaways",
    text: "For future weekends away and memories beyond the wedding day.",
  },
  {
    title: "Experiences Together",
    text: "For new places, shared traditions, and moments we will remember for years.",
  },
];

export const metadata: Metadata = {
  title: "Our Next Chapter | Sumaya & Aditya",
  description: "A private preview of future plans and experiences for Sumaya and Aditya.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function FuturePlansPage() {
  return (
    <main className="future-plans-page">
      <section className="future-plans-hero" aria-labelledby="future-plans-title">
        <video
          className="future-plans-hero-video"
          src="/videos/quote-soft-light-loop.mp4"
          poster="/videos/quote-soft-light-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        />
        <div className="future-plans-hero-wash" aria-hidden="true" />
        <div className="future-plans-hero-content">
          <p className="future-plans-kicker">Future plans & experiences</p>
          <h1 id="future-plans-title">Our Next Chapter</h1>
          <p className="future-plans-subheading">
            Your presence at our wedding is more than enough, and we are so grateful to celebrate this moment with you.
          </p>
          <p className="future-plans-body">
            For family and friends who have asked, we have created a small collection of future plans and experiences
            that would become part of the life we are building together.
          </p>
        </div>
      </section>

      <section className="future-plans-experiences" aria-labelledby="future-plans-experiences-title">
        <div className="future-plans-section-heading">
          <p className="future-plans-kicker">With love</p>
          <h2 id="future-plans-experiences-title">Future Plans & Experiences</h2>
        </div>

        <div className="future-plans-card-rail" role="list" aria-label="Future plans and experiences">
          {contributionCards.map((card, index) => (
            <article className="future-plans-card" key={card.title} role="listitem">
              <div className="future-plans-card-ornament" aria-hidden="true">
                <span />
                <i />
                <span />
              </div>
              <p className="future-plans-card-number">{String(index + 1).padStart(2, "0")}</p>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
              {/* Payment/link destination to be added later. */}
              <button type="button" className="future-plans-card-button" disabled>
                Add to this memory
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="future-plans-closing" aria-label="A note of gratitude">
        <div className="future-plans-closing-card">
          <p>
            More than anything, we are grateful for the people who have supported us, encouraged us, and celebrated this
            next chapter with us. Thank you for being part of our story.
          </p>
        </div>
      </section>
    </main>
  );
}
