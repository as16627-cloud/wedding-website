"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function InnerCircleAccessGate() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!passcode.trim()) {
      setError("Please enter the Inner Circle passcode.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/inner-circle/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        credentials: "same-origin",
        body: JSON.stringify({ passcode }),
      });
      const result = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setError(result?.error ?? "That code didn't work. Please check it and try again.");
        return;
      }

      setPasscode("");
      router.refresh();
    } catch {
      setError("We couldn't check the passcode. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fbf7f2] px-6 py-16 text-[#4f4641]">
      <section className="mx-auto flex min-h-[calc(100svh-8rem)] max-w-xl flex-col items-center justify-center text-center">
        <p className="heading-micro mb-5">Sumaya &amp; Aditya</p>
        <h1 className="heading-primary">Inner Circle</h1>
        <p className="heading-copy mx-auto mt-6 max-w-lg">
          A private little space for the bridal party and closest family. Please enter the passcode to continue.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-9 w-full rounded-[2rem] border border-[#eaded6] bg-[#fffaf7]/82 p-6 shadow-[0_18px_45px_rgba(90,65,50,0.07)] md:p-8"
        >
          <label className="grid gap-3 text-left" htmlFor="inner-circle-passcode">
            <span className="type-section-eyebrow">Passcode</span>
            <input
              id="inner-circle-passcode"
              type="password"
              value={passcode}
              onChange={(event) => setPasscode(event.target.value)}
              className="min-h-12 rounded-2xl border border-[#eaded6] bg-white/80 px-4 text-[#3f302b] outline-none transition duration-300 ease-out placeholder:text-[#a99790] focus:border-[#b98278] focus:ring-2 focus:ring-[#e8cfc8]/45"
              placeholder="Enter passcode"
              autoComplete="current-password"
            />
          </label>

          {error && (
            <p className="type-card-body mt-4 text-left text-[#9b6f68]" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="primary-cta type-button mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Checking..." : "Enter"}
          </button>
        </form>
      </section>
    </main>
  );
}
