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
    <nav className="flex items-center gap-0.5 text-xs sm:text-sm" aria-label="Main">
      {LINKS.map((l) => {
        const active = path === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-ops px-2 py-1 sm:px-2.5 sm:py-1 ${
              active
                ? "bg-ops-link/15 font-medium text-ops-link"
                : "text-ops-muted hover:text-ops-link"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
