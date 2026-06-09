import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "34-0 — Can Your All-Time EuroLeague Roster Go Undefeated?",
  description:
    "Spin the slot machine, draft an all-time EuroLeague five across five eras, and simulate a perfect 34-0 regular season. Every box-score stat counts.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
