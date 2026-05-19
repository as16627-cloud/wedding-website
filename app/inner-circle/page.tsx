import type { Metadata } from "next";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { readInnerCircleSessionToken, verifyInnerCircleSessionToken } from "@/lib/inner-circle-auth";
import InnerCircleAccessGate from "./inner-circle-access-gate";
import InnerCircleContent from "./password-gate";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Inner Circle | Sumaya & Aditya",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default async function InnerCirclePage() {
  await connection();
  const cookieStore = await cookies();
  const hasInnerCircleAccess = verifyInnerCircleSessionToken(readInnerCircleSessionToken(cookieStore));

  if (!hasInnerCircleAccess) {
    return <InnerCircleAccessGate />;
  }

  return <InnerCircleContent />;
}
