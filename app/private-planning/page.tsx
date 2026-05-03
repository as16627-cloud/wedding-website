import type { Metadata } from "next";
import PrivatePlanningDashboard from "./private-planning-dashboard";

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

export default function PrivatePlanningPage() {
  return <PrivatePlanningDashboard />;
}
