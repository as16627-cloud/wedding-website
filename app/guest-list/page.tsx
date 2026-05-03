import type { Metadata } from "next";
import GuestListDashboard from "./guest-list-dashboard";

export const metadata: Metadata = {
  title: "Guest List | Sumaya & Aditya",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function GuestListPage() {
  return <GuestListDashboard />;
}
