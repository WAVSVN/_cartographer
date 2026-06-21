"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Console" },
  { href: "/fleet", label: "Fleet" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/about", label: "About" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="flex items-center gap-3 text-xs sm:gap-4 sm:text-sm" aria-label="Main">
      {LINKS.map((l) => {
        const active = path === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`border-b-2 pb-0.5 transition ${
              active
                ? "border-ops-link font-medium text-ops-text"
                : "border-transparent text-ops-muted hover:border-ops-line hover:text-ops-text"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
