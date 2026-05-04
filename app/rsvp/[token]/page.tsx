import type { Metadata } from "next";
import TokenRsvpForm from "./rsvp-token-form";

export const metadata: Metadata = {
  title: "RSVP | Sumaya & Aditya",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function RsvpTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return <TokenRsvpForm token={token} />;
}
