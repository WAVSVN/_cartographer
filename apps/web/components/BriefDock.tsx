"use client";

import { useState } from "react";
import type { BriefResponse } from "@/lib/types";
import BriefCard from "./BriefCard";
import { SectionLabel } from "./ui";

type Props = {
  latest: BriefResponse | undefined;
  query: string;
  showTools: boolean;
  historyCount: number;
};

export default function BriefDock({ latest, query, showTools, historyCount }: Props) {
  const [open, setOpen] = useState(true);

  if (!latest) return null;

  return (
    <div className="shrink-0 border-t border-ops-line bg-ops-panel">
      <div className="flex items-center justify-between gap-2 border-b border-ops-line px-3 py-1.5 sm:px-4">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex min-w-0 items-center gap-2 text-left"
          aria-expanded={open}
        >
          <SectionLabel>Brief</SectionLabel>
          <span className="truncate text-xs text-ops-muted">{query || "Latest response"}</span>
          <span className="font-mono text-[10px] text-ops-muted">{open ? "▲" : "▼"}</span>
        </button>
        {historyCount > 1 && (
          <span className="shrink-0 font-mono text-[10px] text-ops-muted">
            +{historyCount - 1} in session
          </span>
        )}
      </div>
      {open && (
        <div className="max-h-[40vh] overflow-y-auto scroll-thin p-3 sm:p-4">
          <BriefCard response={latest} showTools={showTools} />
        </div>
      )}
    </div>
  );
}
