import type { Metadata } from "next";
import Link from "next/link";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import Nav from "@/components/Nav";
import FleetHealthStrip from "@/components/FleetHealthStrip";
import "./globals.css";

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

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
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-ops focus:bg-ops-amber focus:px-3 focus:py-2 focus:text-ops-bg"
        >
          Skip to content
        </a>
        <header className="sticky top-0 z-40 border-b border-ops-line bg-ops-panel/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5">
            <Link href="/" className="flex min-w-0 items-center gap-2.5">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-ops border border-ops-amber/50 bg-ops-amber/10 font-mono text-[10px] font-semibold text-ops-amber"
                aria-hidden
              >
                GOC
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold tracking-tight">Grid Ops Command</p>
                <p className="truncate text-[11px] text-ops-muted">Private grid NOC</p>
              </div>
            </Link>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <Nav />
              <span className="rounded-ops border border-ops-line px-1.5 py-0.5 font-mono text-[10px] text-ops-muted">
                demo
              </span>
            </div>
          </div>
          <FleetHealthStrip />
        </header>
        <main id="main">{children}</main>
      </body>
    </html>
  );
}
