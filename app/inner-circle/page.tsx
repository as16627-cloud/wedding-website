import type { Metadata } from "next";
import InnerCircleGate from "./password-gate";

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

export default function InnerCirclePage() {
  return <InnerCircleGate />;
}
