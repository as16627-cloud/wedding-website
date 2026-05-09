"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole } from "lucide-react";

export default function PrivatePlanningLogin() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!passcode.trim()) {
      setError("Enter the private planning passcode.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/private-planning/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        credentials: "same-origin",
        body: JSON.stringify({ passcode }),
      });
      const result = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setError(result?.error ?? "That passcode does not look quite right. Please try again.");
        return;
      }

      setPasscode("");
      router.refresh();
    } catch {
      setError("We could not check the passcode. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="private-planning-page min-h-screen bg-[#fbf7f2] px-6 py-16 text-[#4f4641]">
      <section className="mx-auto flex min-h-[calc(100svh-8rem)] max-w-xl flex-col items-center justify-center text-center">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-[#eaded6] bg-[#fffaf7] shadow-[0_12px_30px_rgba(90,65,50,0.06)]">
          <LockKeyhole className="h-5 w-5 text-[#b98278]" />
        </div>
        <p className="heading-micro mb-5">Private Planning</p>
        <h1 className="heading-primary">Sumaya &amp; Adi</h1>
        <p className="heading-copy mx-auto mt-6 max-w-md">
          A private planning space for vendors, timelines, and upcoming wedding decisions.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-9 w-full rounded-[2rem] border border-[#eaded6] bg-[#fffaf7] p-6 shadow-[0_18px_45px_rgba(90,65,50,0.07)] md:p-8"
        >
          <label className="block text-left">
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[#9a8780]">
              Passcode
            </span>
            <input
              type="password"
              value={passcode}
              onChange={(event) => setPasscode(event.target.value)}
              placeholder="Enter private passcode"
              autoComplete="current-password"
              className="w-full rounded-2xl border border-[#eaded6] bg-white/70 px-4 py-3 text-sm text-[#4f4641] outline-none transition focus:border-[#c79a94] focus:ring-2 focus:ring-[#eaded6]"
            />
          </label>
          {error && <p className="type-helper mt-4 text-left text-[#9b6f68]">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 w-full rounded-full bg-[var(--color-navy)] px-7 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--color-cta-text)] shadow-[0_12px_30px_rgba(20,26,44,0.22)] transition duration-300 ease-out hover:-translate-y-[1px] hover:bg-[var(--color-navy-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Checking..." : "Enter Dashboard"}
          </button>
        </form>
      </section>
    </main>
  );
}
