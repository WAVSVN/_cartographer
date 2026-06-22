import type { Metadata } from "next";
import { Fira_Code, Share_Tech_Mono } from "next/font/google";
import AppKeyboardNav from "@/components/AppKeyboardNav";
import BrandMark from "@/components/BrandMark";
import Nav from "@/components/Nav";
import FleetKpis from "@/components/FleetKpis";
import ShiftClock from "@/components/ShiftClock";
import "./globals.css";

const fira = Fira_Code({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ui",
  display: "swap",
});

const shareTech = Share_Tech_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-brand",
  display: "swap",
});

export const metadata: Metadata = {
  title: "grid ops command",
  description: "Shift console for private-grid deployments — triage, runbooks, handoff.",
  openGraph: {
    title: "grid ops command",
    description: "Private grid shift console.",
    type: "website",
  },
  themeColor: "#000000",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fira.variable} ${shareTech.variable}`}>
      <body className="flex min-h-dvh flex-col overflow-hidden">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:border focus:border-ops-teal-hover focus:bg-black focus:px-3 focus:py-2 focus:text-ops-teal-hover"
        >
          Skip to content
        </a>
        <AppKeyboardNav />
        <header className="sticky top-0 z-40 shrink-0 border-b border-ops-line bg-ops-panel backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-1.5 sm:px-4">
            <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-5">
              <BrandMark />
              <FleetKpis compact />
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <Nav />
              <ShiftClock />
            </div>
          </div>
        </header>
        <main id="main" className="min-h-0 flex-1 overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
