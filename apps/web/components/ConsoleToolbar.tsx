"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
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
import { SectionLabel } from "./ui";

export type ShiftAction = {
  step: number;
  label: string;
  query: string;
  digest?: boolean;
};

export type ConsoleToolbarHandle = {
  openHandoff: () => void;
};

type Props = {
  ranked: RiskRankedDeployment[];
  triageMap: TriageStateMap;
  history: Array<{ query: string; response: BriefResponse }>;
  shiftActions: ShiftAction[];
  onRunDigest: () => void;
  onRunBrief: (query: string) => void;
  onHandoffExport?: () => void;
};

const ConsoleToolbar = forwardRef<ConsoleToolbarHandle, Props>(function ConsoleToolbar(
  {
    ranked,
    triageMap,
    history,
    shiftActions,
    onRunDigest,
    onRunBrief,
    onHandoffExport,
  },
  ref
) {
  const [handoffOpen, setHandoffOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [notes, setNotes] = useState<ShiftNote[]>([]);
  const [draft, setDraft] = useState("");
  const [exporting, setExporting] = useState(false);
  const handoffRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(
    ref,
    () => ({
      openHandoff: () => {
        setHandoffOpen(true);
        setActionsOpen(false);
      },
    }),
    []
  );

  useEffect(() => {
    setNotes(loadShiftNotes());
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (handoffOpen && handoffRef.current && !handoffRef.current.contains(t)) {
        setHandoffOpen(false);
      }
      if (actionsOpen && actionsRef.current && !actionsRef.current.contains(t)) {
        setActionsOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [handoffOpen, actionsOpen]);

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
      onHandoffExport?.();
    } finally {
      setExporting(false);
    }
  }, [ranked, triageMap, notes, history, onHandoffExport]);

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-ops-line px-3 py-2 sm:px-4">
      <div className="relative" ref={handoffRef}>
        <button
          type="button"
          onClick={() => {
            setHandoffOpen((o) => !o);
            setActionsOpen(false);
          }}
          className="ops-btn-ghost"
          aria-expanded={handoffOpen}
        >
          Handoff
        </button>
        {handoffOpen && (
          <div className="absolute left-0 top-full z-30 mt-1 w-80 max-w-[calc(100vw-2rem)] rounded-ops border border-ops-line bg-ops-panel p-3 shadow-lg">
            <div className="mb-2 flex items-center justify-between gap-2">
              <SectionLabel>Shift handoff</SectionLabel>
              <button
                type="button"
                onClick={() => void handleExport()}
                disabled={exporting}
                className="ops-btn-ghost text-xs"
              >
                {exporting ? "Exporting…" : "Export"}
              </button>
            </div>
            <div className="flex gap-2">
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
                placeholder="Log observation…"
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
            {notes.length === 0 ? (
              <p className="mt-2 text-xs text-ops-muted">No notes this shift.</p>
            ) : (
              <ul className="mt-2 max-h-36 space-y-1 overflow-y-auto scroll-thin" role="list">
                {notes.map((n) => (
                  <li
                    key={n.id}
                    className="border-b border-ops-line/40 px-1 py-1.5 text-xs last:border-0"
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
      </div>

      <button type="button" onClick={onRunDigest} className="ops-btn-ghost">
        Digest
      </button>

      <div className="relative" ref={actionsRef}>
        <button
          type="button"
          onClick={() => {
            setActionsOpen((o) => !o);
            setHandoffOpen(false);
          }}
          className="ops-btn-ghost"
          aria-expanded={actionsOpen}
        >
          Actions ▾
        </button>
        {actionsOpen && (
          <div className="absolute left-0 top-full z-30 mt-1 min-w-[12rem] rounded-ops border border-ops-line bg-ops-panel py-1 shadow-lg">
            {shiftActions.map((a) => (
              <button
                key={a.step}
                type="button"
                onClick={() => {
                  setActionsOpen(false);
                  if (a.digest) {
                    onRunDigest();
                  } else {
                    onRunBrief(a.query);
                  }
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-ops-elevated"
              >
                <span className="font-mono text-ops-muted">{a.step}</span>
                <span>{a.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

export default ConsoleToolbar;
