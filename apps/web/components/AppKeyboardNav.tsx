"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const ROUTES = ["/", "/fleet", "/pipeline", "/about"] as const;

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT" ||
    target.isContentEditable
  );
}

function modalOpen(): boolean {
  return Boolean(document.querySelector('[role="dialog"][aria-modal="true"]'));
}

/** Arrow left/right — cycle main screens (interview-prep style). */
export default function AppKeyboardNav() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (modalOpen()) return;

      const idx = ROUTES.indexOf(pathname as (typeof ROUTES)[number]);
      if (idx < 0) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        router.push(ROUTES[(idx - 1 + ROUTES.length) % ROUTES.length]);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        router.push(ROUTES[(idx + 1) % ROUTES.length]);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pathname, router]);

  return null;
}
