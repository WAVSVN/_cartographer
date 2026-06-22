"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/ui-copy";

const LINKS = [
  { href: "/", ...NAV.console },
  { href: "/fleet", ...NAV.fleet },
  { href: "/pipeline", ...NAV.pipeline },
  { href: "/about", ...NAV.about },
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
            title={l.title}
            aria-current={active ? "page" : undefined}
            className={`border-b-2 pb-0.5 lowercase tracking-wide transition ${
              active
                ? "border-ops-accent font-medium text-ops-accent"
                : "border-transparent text-ops-chrome hover:border-ops-green/40 hover:text-ops-green"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
