"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { BriefResponse, RiskRankedDeployment } from "@/lib/types";
import {
  filterByTriage,
  getTriageState,
  loadTriageState,
  saveTriageState,
  setTriageRecord,
  sortQueueByTriage,
  TRIAGE_OPTIONS,
  type TriageState,
  type TriageStateMap,
} from "@/lib/triage-state";
import {
  isPinned,
  loadPins,
  savePins,
  sortWithPinsFirst,
  togglePin,
} from "@/lib/pins";
import { isOverdue } from "@/lib/sla-urgency";
import BriefCard from "./BriefCard";
import CommandPalette from "./CommandPalette";
import DeploymentDetail, { type DeploymentDetailData } from "./DeploymentDetail";
import OverdueAlertStrip from "./OverdueAlertStrip";
import ShiftHandoffPanel from "./ShiftHandoffPanel";
import ShortcutsHelp from "./ShortcutsHelp";
import SlaCountdown from "./SlaCountdown";
import { Panel, RiskBar, Skeleton, StatusBadge, TriageBadge } from "./ui";

const REFRESH_MS = 5 * 60 * 1000;

const SHIFT_ACTIONS = [
  { step: 1, label: "Morning digest", query: "Morning ops digest", digest: true },
  { step: 2, label: "Triage exception", query: "Deployment BRG-2047 is red — what happened?" },
  { step: 3, label: "SLA slip check", query: "If BRG-1102 slips 4 weeks, who breaches SLA?" },
];

type QueueFilter = "all" | "exception" | "watch" | "overdue" | "my-triage";

const FILTERS: { id: QueueFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "exception", label: "Exception" },
  { id: "watch", label: "Watch" },
  { id: "overdue", label: "Overdue" },
  { id: "my-triage", label: "My triage" },
];

function filterRanked(list: RiskRankedDeployment[], filter: QueueFilter) {
  switch (filter) {
    case "exception":
      return list.filter((d) => d.status === "exception");
    case "watch":
      return list.filter((d) => d.status === "watch");
    case "overdue":
      return list.filter((d) => d.days_to_deadline !== null && d.days_to_deadline < 0);
    case "my-triage":
      return list;
    default:
      return list;
  }
}

export default function OpsConsole() {
  const [ranked, setRanked] = useState<RiskRankedDeployment[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<DeploymentDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailFocused, setDetailFocused] = useState(false);
  const [filter, setFilter] = useState<QueueFilter>("all");
  const [showCleared, setShowCleared] = useState(false);
  const [triageMap, setTriageMap] = useState<TriageStateMap>({});
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Array<{ query: string; response: BriefResponse }>>([]);
  const [showTools, setShowTools] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [pins, setPins] = useState<string[]>([]);
  const [queueOpen, setQueueOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const booted = useRef(false);
  const commandRef = useRef<HTMLInputElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    setTriageMap(loadTriageState());
    setPins(loadPins());
  }, []);

  const handleTriageChange = useCallback(
    (deploymentId: string, update: { state: TriageState; note?: string }) => {
      setTriageMap((prev) => {
        const next = setTriageRecord(prev, deploymentId, update);
        saveTriageState(next);
        return next;
      });
    },
    []
  );

  const trancheFilter = searchParams.get("tranche");

  const overdueCount = useMemo(
    () => ranked.filter((d) => isOverdue(d.days_to_deadline)).length,
    [ranked]
  );

  const filtered = useMemo(() => {
    let list = ranked;
    if (trancheFilter) {
      list = list.filter((d) => d.gfa_tranche === trancheFilter);
    }
    const byStatus = filterRanked(list, filter);
    const byTriage = filterByTriage(byStatus, triageMap, filter === "my-triage" ? "my-triage" : "all");
    const sorted = sortQueueByTriage(byTriage, triageMap, showCleared);
    return sortWithPinsFirst(sorted, pins);
  }, [ranked, filter, triageMap, showCleared, pins, trancheFilter]);

  const selectedTriageState = selectedId ? getTriageState(triageMap, selectedId) : "unacked";
  const selectedTriageRecord = selectedId ? triageMap[selectedId] ?? null : null;

  const initialRankedLoad = useRef(false);

  useEffect(() => {
    const loadRanked = () =>
      fetch("/api/deployments")
        .then((r) => r.json())
        .then((data) => {
          const list: RiskRankedDeployment[] = data.risk_ranked ?? [];
          setRanked(list);
          if (!initialRankedLoad.current) {
            initialRankedLoad.current = true;
            if (!searchParams.get("deploy") && list[0]) setSelectedId(list[0].id);
          }
        });

    void loadRanked();
    const id = window.setInterval(loadRanked, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [searchParams]);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setDetail(null);
    setError(null);
    try {
      const res = await fetch(`/api/deployment/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error("Detail load failed");
      const data: DeploymentDetailData = await res.json();
      setDetail(data);
    } catch {
      setError("Failed to load deployment detail.");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) void loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  const pushResponse = useCallback((q: string, data: BriefResponse) => {
    setHistory((h) => [{ query: q, response: data }, ...h].slice(0, 12));
  }, []);

  const runBrief = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) return;
      setLoading(true);
      setQuery(trimmed);
      setQueueOpen(false);
      setError(null);
      try {
        const res = await fetch("/api/brief", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: trimmed }),
        });
        if (!res.ok) throw new Error("Brief request failed");
        const data: BriefResponse = await res.json();
        if (!data.brief) throw new Error("Invalid brief response");
        pushResponse(trimmed, data);
        const idMatch = trimmed.match(/\b(BRG|PRM)-\d{4}\b/i);
        if (idMatch) setSelectedId(idMatch[0].toUpperCase());
      } catch {
        setError("Scenario failed — check connection and retry.");
      } finally {
        setLoading(false);
      }
    },
    [pushResponse]
  );

  const runDigest = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/digest");
      if (!res.ok) throw new Error("Digest request failed");
      const data = await res.json();
      const response: BriefResponse = {
        brief: data.brief,
        validation: data.validation,
        tools: [
          { tool: "get_fleet_summary", args: {}, result: data.fleet },
          { tool: "get_pipeline", args: {}, result: data.upcoming_deadlines },
          { tool: "list_exceptions", args: {}, result: data.top_risks },
        ],
        generated_at: data.generated_at,
      };
      pushResponse("Morning ops digest", response);
      setQuery("Morning ops digest");
    } catch {
      setError("Digest failed — check connection and retry.");
    }
  }, [pushResponse]);

  const generateBriefForSelected = useCallback(() => {
    if (!selectedId) return;
    void runBrief(`Deployment ${selectedId} is red — what happened?`);
  }, [selectedId, runBrief]);

  const selectDeployment = useCallback((id: string) => {
    setSelectedId(id);
    setDetailFocused(false);
    setQueueOpen(false);
  }, []);

  const handlePinToggle = useCallback((deploymentId: string) => {
    setPins((prev) => {
      const next = togglePin(prev, deploymentId);
      savePins(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedId(null);
      return;
    }
    selectDeployment(filtered[0].id);
  }, [filter, showCleared]);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    const dep = searchParams.get("deploy");
    if (dep?.match(/^(BRG|PRM)-\d{4}$/i)) {
      setSelectedId(dep.toUpperCase());
    }
    if (searchParams.get("filter") === "overdue") {
      setFilter("overdue");
    }
  }, [searchParams]);

  const moveSelection = useCallback(
    (delta: number) => {
      if (filtered.length === 0) return;
      const idx = filtered.findIndex((d) => d.id === selectedId);
      const next =
        idx < 0
          ? delta > 0
            ? 0
            : filtered.length - 1
          : Math.max(0, Math.min(filtered.length - 1, idx + delta));
      selectDeployment(filtered[next].id);
    },
    [filtered, selectedId, selectDeployment]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowPalette(true);
        return;
      }

      if (e.key === "Escape") {
        if (showPalette) {
          e.preventDefault();
          setShowPalette(false);
          return;
        }
        if (showShortcuts) {
          e.preventDefault();
          setShowShortcuts(false);
        }
        return;
      }

      if (showPalette || showShortcuts) return;

      if (e.key === "?" && !isInput) {
        e.preventDefault();
        setShowShortcuts(true);
        return;
      }

      if (e.key === "/" && !isInput) {
        e.preventDefault();
        commandRef.current?.focus();
        return;
      }

      if (isInput) return;

      if (e.key === "j") {
        e.preventDefault();
        moveSelection(1);
        return;
      }

      if (e.key === "k") {
        e.preventDefault();
        moveSelection(-1);
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        if (detailFocused) {
          generateBriefForSelected();
        } else {
          detailRef.current?.focus();
          setDetailFocused(true);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showPalette, showShortcuts, detailFocused, moveSelection, generateBriefForSelected]);

  const latest = history[0]?.response;

  return (
    <>
      <ShortcutsHelp open={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <CommandPalette
        open={showPalette}
        onClose={() => setShowPalette(false)}
        deployments={ranked}
        shiftActions={SHIFT_ACTIONS}
        onSelectDeployment={selectDeployment}
        onRunBrief={(q) => void runBrief(q)}
        onRunDigest={() => void runDigest()}
      />

      <OverdueAlertStrip count={overdueCount} onOverdueClick={() => setFilter("overdue")} />

      <div className="mx-auto max-w-7xl lg:grid lg:grid-cols-[280px_1fr]">
        {trancheFilter && (
          <div className="col-span-full border-b border-ops-amber/30 bg-ops-amber/5 px-4 py-2 font-mono text-xs text-ops-amber lg:col-span-2">
            GFA tranche {trancheFilter} — {filtered.length} in queue
          </div>
        )}
        <div className="border-b border-ops-line p-3 lg:hidden">
          <button
            type="button"
            onClick={() => setQueueOpen((o) => !o)}
            className="ops-btn-ghost w-full text-left font-mono"
            aria-expanded={queueOpen}
          >
            Risk queue ({filtered.length}) {queueOpen ? "▲" : "▼"}
          </button>
        </div>

        <aside
          className={`border-b border-ops-line lg:border-b-0 lg:border-r ${
            queueOpen ? "block" : "hidden lg:block"
          }`}
        >
          <div className="p-3 lg:p-4">
            <div className="mb-2 hidden items-center justify-between lg:flex">
              <h2 className="text-[10px] font-semibold uppercase tracking-widest text-ops-muted">
                Risk queue
              </h2>
              <button
                type="button"
                onClick={() => void runDigest()}
                className="ops-btn-ghost border-ops-amber/30 text-ops-amber"
              >
                Digest
              </button>
            </div>

            <div className="mb-2 flex flex-wrap gap-1" role="tablist" aria-label="Queue filters">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={filter === f.id}
                  onClick={() => setFilter(f.id)}
                  className={`rounded-ops border px-2 py-0.5 font-mono text-[10px] transition ${
                    filter === f.id
                      ? "border-ops-amber/50 bg-ops-amber/10 text-ops-amber"
                      : "border-ops-line text-ops-muted hover:border-ops-amber/30"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="mb-2">
              <button
                type="button"
                onClick={() => setShowCleared((s) => !s)}
                aria-pressed={showCleared}
                className={`rounded-ops border px-2 py-0.5 font-mono text-[10px] transition ${
                  showCleared
                    ? "border-ops-amber/50 bg-ops-amber/10 text-ops-amber"
                    : "border-ops-line text-ops-muted hover:border-ops-amber/30"
                }`}
              >
                Show cleared
              </button>
            </div>

            <ul className="space-y-1" role="list">
              {filtered.length === 0 ? (
                <li className="px-2 py-3 text-xs text-ops-muted">No deployments match filter.</li>
              ) : (
                filtered.map((d, i) => {
                  const triageState = getTriageState(triageMap, d.id);
                  const triageShort =
                    TRIAGE_OPTIONS.find((o) => o.id === triageState)?.short ?? "NEW";
                  return (
                  <li key={d.id}>
                    <div
                      className={`flex rounded-ops border transition ${
                        selectedId === d.id
                          ? "border-ops-amber/50 bg-ops-amber/5"
                          : "border-transparent hover:border-ops-line hover:bg-ops-elevated"
                      } ${triageState === "cleared" ? "opacity-60" : ""}`}
                    >
                      <button
                        type="button"
                        aria-label={isPinned(pins, d.id) ? `Unpin ${d.id}` : `Pin ${d.id}`}
                        aria-pressed={isPinned(pins, d.id)}
                        onClick={() => handlePinToggle(d.id)}
                        className={`shrink-0 self-start rounded-l-ops px-2 py-2 font-mono text-[10px] transition ${
                          isPinned(pins, d.id)
                            ? "text-ops-amber"
                            : "text-ops-muted hover:text-ops-amber"
                        }`}
                      >
                        {isPinned(pins, d.id) ? "★" : "☆"}
                      </button>
                      <button
                        type="button"
                        onClick={() => selectDeployment(d.id)}
                        aria-label={`${d.id}, ${d.status}, risk score ${d.risk_score}, triage ${triageState}`}
                        aria-current={selectedId === d.id ? "true" : undefined}
                        className="min-w-0 flex-1 rounded-r-ops px-2 py-2 text-left"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] text-ops-muted">#{i + 1}</span>
                            <StatusBadge status={d.status} />
                            <TriageBadge state={triageState} short={triageShort} />
                            <span className="font-mono text-xs text-ops-amber">{d.id}</span>
                          </div>
                          <span className="font-mono text-xs tabular-nums text-ops-critical">
                            {d.risk_score}
                          </span>
                        </div>
                      <p className="mt-1 line-clamp-1 text-xs leading-snug">{d.name}</p>
                      <div className="mt-1.5">
                        <RiskBar score={d.risk_score} />
                      </div>
                      <p className="mt-1 font-mono text-[10px] text-ops-muted">
                        {d.mw_gap} MW gap
                        {d.days_to_deadline !== null && (
                          <>
                            {" · "}
                            <SlaCountdown days={d.days_to_deadline} className="text-[10px]" />
                          </>
                        )}
                      </p>
                      </button>
                    </div>
                  </li>
                  );
                })
              )}
            </ul>
          </div>
        </aside>

        <div className="flex min-h-[calc(100vh-120px)] flex-col">
          <div className="flex-1 overflow-y-auto scroll-thin p-3 sm:p-4">
            {error && (
              <div
                className="mb-3 rounded-ops border border-ops-critical/40 bg-ops-critical/10 px-3 py-2 text-sm text-ops-critical"
                role="alert"
              >
                {error}
              </div>
            )}

            <div
              ref={detailRef}
              tabIndex={-1}
              onFocus={() => setDetailFocused(true)}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDetailFocused(false);
                }
              }}
              className="outline-none"
            >
              <DeploymentDetail
                data={detail}
                loading={detailLoading}
                onGenerateBrief={generateBriefForSelected}
                briefLoading={loading}
                triage={selectedTriageRecord}
                triageState={selectedTriageState}
                trancheFilter={trancheFilter}
                onTriageChange={
                  selectedId
                    ? (update) => handleTriageChange(selectedId, update)
                    : undefined
                }
              />
            </div>

            <ShiftHandoffPanel ranked={ranked} triageMap={triageMap} history={history} />

            <Panel title="Shift actions" className="mb-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {SHIFT_ACTIONS.map((a) => (
                  <button
                    key={a.step}
                    type="button"
                    onClick={() => {
                      if (a.label === "Morning digest") {
                        void runDigest();
                      } else {
                        void runBrief(a.query);
                      }
                    }}
                    className="ops-btn-ghost flex items-center gap-2 text-left"
                  >
                    <span className="font-mono text-ops-amber">{a.step}</span>
                    <span>{a.label}</span>
                  </button>
                ))}
              </div>
            </Panel>

            {loading && !latest ? (
              <div className="ops-panel space-y-3 p-4" aria-busy="true">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-4 w-full" />
                <p className="text-xs text-ops-muted">Generating brief…</p>
              </div>
            ) : latest ? (
              <BriefCard response={latest} showTools={showTools} title="Active brief" />
            ) : null}

            {history.length > 1 && (
              <div className="mt-4">
                <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-ops-muted">
                  Session audit
                </h3>
                <ul className="space-y-1">
                  {history.slice(1, 5).map((h) => (
                    <li
                      key={`${h.query}-${h.response.generated_at}`}
                      className="rounded-ops border border-ops-line bg-ops-panel/50 px-3 py-1.5 text-[11px]"
                    >
                      <span className="text-ops-muted">
                        {new Date(h.response.generated_at).toLocaleTimeString()}
                      </span>
                      <span className="mx-2 text-ops-line">·</span>
                      <span className="line-clamp-1">{h.query}</span>
                      <span
                        className={`ml-2 inline-block rounded-ops px-1 font-mono text-[10px] ${
                          h.response.validation.ok
                            ? "bg-ops-pass/15 text-ops-pass"
                            : "bg-ops-critical/15 text-ops-critical"
                        }`}
                      >
                        {h.response.validation.ok ? "OK" : "FAIL"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="border-t border-ops-line bg-ops-panel/95 p-3 sm:p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void runBrief(query);
              }}
              className="flex gap-2"
              role="search"
              aria-label="Run operations scenario"
            >
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-ops-muted">
                  &gt;
                </span>
                <input
                  ref={commandRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="run scenario…"
                  className="ops-input w-full pl-7"
                  disabled={loading}
                  aria-label="Scenario command"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowTools((s) => !s)}
                className="ops-btn-ghost hidden sm:inline-flex"
                aria-pressed={showTools}
              >
                Trace
              </button>
              <button
                type="button"
                onClick={() => setShowShortcuts(true)}
                className="ops-btn-ghost inline-flex"
                aria-label="Keyboard shortcuts"
              >
                ?
              </button>
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="ops-btn-primary shrink-0"
              >
                {loading ? "Running…" : "Run"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
