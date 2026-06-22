"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type RefObject,
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
import {
  clearAuditLog,
  formatAuditAction,
  loadAuditLog,
  logAudit,
  type AuditEntry,
} from "@/lib/audit-log";
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
  query: string;
  onQueryChange: (value: string) => void;
  onSubmitQuery: () => void;
  queryLoading: boolean;
  commandInputRef?: RefObject<HTMLInputElement | null>;
  onShowShortcuts?: () => void;
  useLlm?: boolean;
  onUseLlmChange?: (value: boolean) => void;
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
    query,
    onQueryChange,
    onSubmitQuery,
    queryLoading,
    commandInputRef,
    onShowShortcuts,
    useLlm = false,
    onUseLlmChange,
  },
  ref
) {
  const [handoffOpen, setHandoffOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [notes, setNotes] = useState<ShiftNote[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [draft, setDraft] = useState("");
  const [exporting, setExporting] = useState(false);
  const handoffRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const auditRef = useRef<HTMLDivElement>(null);

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
    setAuditLog(loadAuditLog());
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
      if (auditOpen && auditRef.current && !auditRef.current.contains(t)) {
        setAuditOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [handoffOpen, actionsOpen, auditOpen]);

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
      const currentAudit = loadAuditLog();
      const bundle = buildHandoffBundle({
        ranked,
        triageMap,
        shiftNotes: notes,
        history,
        fleet,
        auditLog: currentAudit,
        exportedAt: at,
      });
      downloadMarkdown(buildMarkdown(bundle), handoffFilename(at));
      const nextAudit = logAudit({ action: "handoff_export", detail: "shift markdown export" });
      setAuditLog(nextAudit);
      onHandoffExport?.();
    } finally {
      setExporting(false);
    }
  }, [ranked, triageMap, notes, history, onHandoffExport]);

  const refreshAudit = useCallback(() => setAuditLog(loadAuditLog()), []);

  const handleClearAudit = useCallback(() => {
    clearAuditLog();
    setAuditLog([]);
  }, []);

  return (
    <div className="shrink-0 border-b border-ops-line px-2 py-1.5 sm:px-3">
      <div className="flex flex-wrap items-center gap-1.5">
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
            handoff
          </button>
          {handoffOpen && (
            <div className="absolute left-0 top-full z-30 mt-1 w-72 max-w-[calc(100vw-1.5rem)] border border-ops-line bg-black/95 p-2">
              <div className="mb-2 flex items-center justify-between gap-2">
                <SectionLabel>Shift notes</SectionLabel>
                <button
                  type="button"
                  onClick={() => void handleExport()}
                  disabled={exporting}
                  className="ops-btn-ghost text-[10px]"
                >
                  {exporting ? "…" : "export"}
                </button>
              </div>
              <div className="flex gap-1.5">
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
                  placeholder="Note for next shift…"
                  maxLength={500}
                  className="ops-input flex-1 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddNote}
                  disabled={!draft.trim()}
                  className="ops-btn-ghost shrink-0 text-[10px]"
                >
                  add
                </button>
              </div>
              {notes.length > 0 && (
                <ul className="mt-2 max-h-28 space-y-1 overflow-y-auto scroll-thin" role="list">
                  {notes.map((n) => (
                    <li
                      key={n.id}
                      className="border-b border-ops-line/40 py-1 text-[11px] last:border-0"
                    >
                      <span className="font-mono text-[10px] text-ops-muted">
                        {new Date(n.at).toLocaleTimeString()}
                      </span>
                      <p className="leading-snug">{n.text}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="relative" ref={auditRef}>
          <button
            type="button"
            onClick={() => {
              refreshAudit();
              setAuditOpen((o) => !o);
              setHandoffOpen(false);
              setActionsOpen(false);
            }}
            className="ops-btn-ghost"
            aria-expanded={auditOpen}
          >
            audit{auditLog.length > 0 ? ` (${auditLog.length})` : ""}
          </button>
          {auditOpen && (
            <div className="absolute left-0 top-full z-30 mt-1 w-80 max-w-[calc(100vw-1.5rem)] border border-ops-line bg-black/95 p-2">
              <div className="mb-2 flex items-center justify-between gap-2">
                <SectionLabel>Action log</SectionLabel>
                <button
                  type="button"
                  onClick={handleClearAudit}
                  className="ops-btn-ghost text-[10px]"
                >
                  clear
                </button>
              </div>
              {auditLog.length === 0 ? (
                <p className="text-[11px] text-ops-muted">No actions logged this shift.</p>
              ) : (
                <ul className="max-h-40 space-y-1 overflow-y-auto scroll-thin" role="list">
                  {auditLog.slice(0, 40).map((entry) => (
                    <li key={entry.id} className="border-b border-ops-line/40 py-1 text-[11px] last:border-0">
                      <span className="font-mono text-[10px] text-ops-muted">
                        {new Date(entry.at).toLocaleTimeString()} · {formatAuditAction(entry.action)}
                        {entry.deployment_id ? ` · ${entry.deployment_id}` : ""}
                      </span>
                      <p className="leading-snug">{entry.detail}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <button type="button" onClick={onRunDigest} className="ops-btn-ghost" title="Fleet summary">
          summary
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
            asks ▾
          </button>
          {actionsOpen && (
            <div className="absolute left-0 top-full z-30 mt-1 min-w-[11rem] border border-ops-line bg-black/95 py-1">
              {shiftActions.map((a) => (
                <button
                  key={a.step}
                  type="button"
                  onClick={() => {
                    setActionsOpen(false);
                    if (a.digest) onRunDigest();
                    else onRunBrief(a.query);
                  }}
                  className="flex w-full px-2.5 py-1 text-left text-xs hover:bg-ops-elevated"
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <form
          className="flex min-w-[12rem] flex-1 items-center gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmitQuery();
          }}
          role="search"
        >
          <input
            ref={commandInputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="ask about a site, slip, fleet gap, deadlines…"
            className="ops-input min-w-0 flex-1 py-1 text-xs"
            disabled={queryLoading}
            aria-label="Ops query"
          />
          {onUseLlmChange && (
            <label className="flex shrink-0 items-center gap-1 text-[10px] text-ops-muted">
              <input
                type="checkbox"
                checked={useLlm}
                onChange={(e) => onUseLlmChange(e.target.checked)}
                className="accent-ops-accent"
              />
              AI
            </label>
          )}
          <button
            type="submit"
            disabled={queryLoading || !query.trim()}
            className="ops-btn-primary shrink-0 px-2.5 py-1 text-xs"
          >
            {queryLoading ? "…" : "run"}
          </button>
        </form>

        {onShowShortcuts && (
          <button
            type="button"
            onClick={onShowShortcuts}
            className="ops-btn-ghost px-2 py-1 text-[10px]"
            aria-label="Keyboard shortcuts"
          >
            ?
          </button>
        )}
      </div>
    </div>
  );
});

export default ConsoleToolbar;
