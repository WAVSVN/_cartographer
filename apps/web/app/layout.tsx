import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import FleetKpis from "@/components/FleetKpis";
import ShiftClock from "@/components/ShiftClock";
import "./globals.css";

export const metadata: Metadata = {
  title: "Grid Ops Command — Private Grid Operations",
  description:
    "Fleet intelligence, bridge pipeline, risk-ranked ops queue, morning digest, and governed AI briefs for private-grid deployments.",
  openGraph: {
    title: "Grid Ops Command",
    description: "Private grid ops console — fleet, pipeline, scenarios, validated briefs.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-ops focus:bg-ops-link focus:px-3 focus:py-2 focus:text-ops-bg"
        >
          Skip to content
        </a>
        <header className="sticky top-0 z-40 border-b border-ops-line bg-ops-panel">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2">
            <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-6">
              <Link href="/" className="min-w-0 shrink-0">
                <p className="truncate text-sm font-semibold tracking-tight">Grid Ops Command</p>
                <p className="truncate text-xs text-ops-muted">Private grid operations</p>
              </Link>
              <div className="hidden min-w-0 flex-1 sm:block">
                <FleetKpis compact />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <Nav />
              <ShiftClock />
            </div>
          </div>
          <div className="border-t border-ops-line sm:hidden">
            <FleetKpis compact />
          </div>
        </header>
        <main id="main">{children}</main>
      </body>
    </html>
  );
}
