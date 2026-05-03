import type { Metadata } from "next";
import GuestAdmin from "./guest-admin";

export const metadata: Metadata = {
  title: "Guest Admin | Sumaya & Aditya",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function AdminPage() {
  return <GuestAdmin />;
}
