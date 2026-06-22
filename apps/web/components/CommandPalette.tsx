"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RiskRankedDeployment } from "@/lib/types";
import {
  buildPaletteItems,
  searchPaletteItems,
  type PaletteItem,
} from "@/lib/palette-search";

type ShiftAction = {
  step: number;
  label: string;
  query: string;
  digest?: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  deployments: RiskRankedDeployment[];
  shiftActions: ShiftAction[];
  onSelectDeployment: (id: string) => void;
  onRunBrief: (query: string) => void;
  onRunDigest: () => void;
};

export default function CommandPalette({
  open,
  onClose,
  deployments,
  shiftActions,
  onSelectDeployment,
  onRunBrief,
  onRunDigest,
}: Props) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const allItems = useMemo(
    () => buildPaletteItems(deployments, shiftActions),
    [deployments, shiftActions]
  );

  const results = useMemo(
    () => searchPaletteItems(allItems, query),
    [allItems, query]
  );

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    const t = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const runItem = useCallback(
    (item: PaletteItem) => {
      if (item.kind === "deployment") {
        onSelectDeployment(item.deployment.id);
      } else if (item.digest) {
        onRunDigest();
      } else {
        onRunBrief(item.query);
      }
      onClose();
    },
    [onSelectDeployment, onRunBrief, onRunDigest, onClose]
  );

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(results.length - 1, i + 1));
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
        return;
      }

      if (e.key === "Enter" && results[activeIndex]) {
        e.preventDefault();
        runItem(results[activeIndex]);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, results, activeIndex, runItem, onClose]);

  useEffect(() => {
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, results]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ops-bg/80 p-4 pt-[12vh] backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="palette-title"
      onClick={onClose}
    >
      <div
        className="ops-panel w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-ops-line p-3">
          <h2 id="palette-title" className="sr-only">
            Command palette
          </h2>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to a site or run a quick ask…"
            className="ops-input w-full"
            aria-label="Command palette search"
            autoComplete="off"
          />
        </div>
        <ul ref={listRef} className="max-h-72 overflow-y-auto scroll-thin py-1" role="listbox">
          {results.length === 0 ? (
            <li className="px-3 py-4 text-xs text-ops-muted">No matches.</li>
          ) : (
            results.map((item, i) => (
              <li key={item.id} role="option" aria-selected={i === activeIndex}>
                <button
                  type="button"
                  onClick={() => runItem(item)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`flex w-full flex-col gap-0.5 px-3 py-2 text-left transition ${
                    i === activeIndex ? "bg-ops-teal/10" : "hover:bg-ops-elevated"
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm">
                    <span
                      className={`rounded-ops border px-1 font-mono text-[10px] ${
                        item.kind === "deployment"
                          ? "border-ops-teal/50 text-ops-teal-hover"
                          : "border-ops-line text-ops-muted"
                      }`}
                    >
                      {item.kind === "deployment" ? "site" : "ask"}
                    </span>
                    <span className="font-medium">{item.label}</span>
                  </span>
                  <span className="pl-9 text-xs text-ops-muted">{item.subtitle}</span>
                </button>
              </li>
            ))
          )}
        </ul>
        <div className="border-t border-ops-line px-3 py-2 font-mono text-[10px] text-ops-muted">
          ↑↓ navigate · Enter select · Esc close
        </div>
      </div>
    </div>
  );
}
