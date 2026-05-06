import type { Metadata } from "next";
import { cookies } from "next/headers";
import {
  readPrivatePlanningSessionToken,
} from "@/lib/private-planning-auth";
import { verifyPrivatePlanningSession } from "@/lib/private-planning-session";
import PrivatePlanningDashboard from "./private-planning-dashboard";
import PrivatePlanningLogin from "./private-planning-login";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private Planning | Sumaya & Adi",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default async function PrivatePlanningPage() {
  const cookieStore = await cookies();
  const hasPrivatePlanningAccess = await verifyPrivatePlanningSession(readPrivatePlanningSessionToken(cookieStore)).catch(
    (error) => {
      console.error("Private planning session check failed.", error);
      return false;
    },
  );

  if (!hasPrivatePlanningAccess) {
    return <PrivatePlanningLogin />;
  }

  return <PrivatePlanningDashboard />;
}
