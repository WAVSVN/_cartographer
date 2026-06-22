"use client";

import { useState } from "react";
import type { BriefResponse } from "@/lib/types";
import BriefCard from "./BriefCard";

type Props = {
  latest: BriefResponse | undefined;
  query: string;
  showTools: boolean;
  onToggleTools: () => void;
  historyCount: number;
};

export default function BriefDock({
  latest,
  query,
  showTools,
  onToggleTools,
  historyCount,
}: Props) {
  const [open, setOpen] = useState(false);

  if (!latest) return null;

  return (
    <div className="shrink-0 border-t border-ops-line bg-black/80">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-1 text-left text-[10px] sm:px-4"
        aria-expanded={open}
      >
        <span className="shrink-0 text-ops-muted-bright">summary</span>
        <span className="min-w-0 flex-1 truncate text-ops-muted">{query || "latest answer"}</span>
        {historyCount > 1 && (
          <span className="shrink-0 font-mono text-ops-muted">+{historyCount - 1}</span>
        )}
        <span className="shrink-0 text-ops-muted">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="max-h-[min(28vh,240px)] overflow-y-auto scroll-thin border-t border-ops-line/60 px-2 py-2 sm:px-3">
          <div className="mb-1 flex justify-end">
            <button
              type="button"
              onClick={onToggleTools}
              className="text-[10px] text-ops-teal-dim hover:text-ops-green"
              aria-pressed={showTools}
            >
              {showTools ? "hide sources" : "sources"}
            </button>
          </div>
          <BriefCard response={latest} showTools={showTools} />
        </div>
      )}
    </div>
  );
}
