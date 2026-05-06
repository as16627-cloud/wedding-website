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

const privatePlanningTabs = ["Overview", "Vendors", "Calendar", "Timeline", "Runsheet", "Guests", "Files", "Notes"] as const;
type PrivatePlanningTab = (typeof privatePlanningTabs)[number];

function getInitialTab(value: string | string[] | undefined): PrivatePlanningTab {
  const tab = Array.isArray(value) ? value[0] : value;

  return privatePlanningTabs.find((candidate) => candidate.toLowerCase() === tab?.toLowerCase()) ?? "Overview";
}

export default async function PrivatePlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] | undefined }>;
}) {
  const cookieStore = await cookies();
  const initialTab = getInitialTab((await searchParams).tab);
  const hasPrivatePlanningAccess = await verifyPrivatePlanningSession(readPrivatePlanningSessionToken(cookieStore)).catch(
    (error) => {
      console.error("Private planning session check failed.", error);
      return false;
    },
  );

  if (!hasPrivatePlanningAccess) {
    return <PrivatePlanningLogin />;
  }

  return <PrivatePlanningDashboard initialTab={initialTab} />;
}
