"use client";

import { useCallback, useEffect, useState } from "react";
import type { BriefResponse, RiskRankedDeployment } from "@/lib/types";
import type { TriageStateMap } from "@/lib/triage-state";
import {
  addShiftNote,
  buildHandoffBundle,
  buildMarkdown,
  downloadMarkdown,
  fetchFleetSummary,
  handoffFilename,
  loadShiftNotes,
  saveShiftNotes,
  type ShiftNote,
} from "@/lib/shift-handoff";
import { Panel } from "./ui";

type Props = {
  ranked: RiskRankedDeployment[];
  triageMap: TriageStateMap;
  history: Array<{ query: string; response: BriefResponse }>;
};

export default function ShiftHandoffPanel({ ranked, triageMap, history }: Props) {
  const [open, setOpen] = useState(true);
  const [notes, setNotes] = useState<ShiftNote[]>([]);
  const [draft, setDraft] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setNotes(loadShiftNotes());
  }, []);

  const persistNotes = useCallback((next: ShiftNote[]) => {
    setNotes(next);
    saveShiftNotes(next);
  }, []);

  const handleAddNote = useCallback(() => {
    const next = addShiftNote(notes, draft);
    if (next.length === notes.length) return;
    persistNotes(next);
    setDraft("");
  }, [draft, notes, persistNotes]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const fleet = await fetchFleetSummary();
      const at = new Date();
      const bundle = buildHandoffBundle({
        ranked,
        triageMap,
        shiftNotes: notes,
        history,
        fleet,
        exportedAt: at,
      });
      const markdown = buildMarkdown(bundle);
      downloadMarkdown(markdown, handoffFilename(at));
    } finally {
      setExporting(false);
    }
  }, [ranked, triageMap, notes, history]);

  return (
    <Panel className="mb-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 text-left"
          aria-expanded={open}
        >
          <span className="text-[10px] font-semibold uppercase tracking-widest text-ops-muted">
            Shift handoff
          </span>
          <span className="font-mono text-[10px] text-ops-muted">{open ? "▲" : "▼"}</span>
        </button>
        <button
          type="button"
          onClick={() => void handleExport()}
          disabled={exporting}
          className="ops-btn-ghost shrink-0 border-ops-amber/30 text-ops-amber text-xs"
        >
          {exporting ? "Exporting…" : "Export shift handoff"}
        </button>
      </div>

      {open && (
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-ops-muted">
              Shift notes
            </label>
            <div className="mt-1 flex gap-2">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddNote();
                  }
                }}
                placeholder="Log observation or action…"
                maxLength={500}
                className="ops-input flex-1 text-xs"
              />
              <button
                type="button"
                onClick={handleAddNote}
                disabled={!draft.trim()}
                className="ops-btn-ghost shrink-0 text-xs"
              >
                Add
              </button>
            </div>
          </div>

          {notes.length === 0 ? (
            <p className="text-xs text-ops-muted">No notes this shift.</p>
          ) : (
            <ul className="max-h-40 space-y-1 overflow-y-auto scroll-thin" role="list">
              {notes.map((n) => (
                <li
                  key={n.id}
                  className="rounded-ops border border-ops-line bg-ops-bg/40 px-2.5 py-1.5 text-xs"
                >
                  <span className="font-mono text-[10px] text-ops-muted">
                    {new Date(n.at).toLocaleString()}
                  </span>
                  <p className="mt-0.5 leading-snug">{n.text}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Panel>
  );
}
