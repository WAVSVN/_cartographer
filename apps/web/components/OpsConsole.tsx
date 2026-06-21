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
import { isOnboardingDone, markOnboardingDone } from "@/lib/onboarding";
import BriefDock from "./BriefDock";
import CommandPalette from "./CommandPalette";
import ConsoleToolbar, { type ConsoleToolbarHandle } from "./ConsoleToolbar";
import DeploymentDetail, { type DeploymentDetailData } from "./DeploymentDetail";
import OverdueAlertStrip from "./OverdueAlertStrip";
import ShiftOnboarding from "./ShiftOnboarding";
import ShortcutsHelp from "./ShortcutsHelp";
import SlaCountdown from "./SlaCountdown";
import { SectionLabel, Skeleton, StatusBadge, TriageBadge } from "./ui";

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

function SegmentedFilter<T extends string>({
  items,
  value,
  onChange,
  label,
}: {
  items: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  label: string;
}) {
  return (
    <div className="flex flex-wrap gap-3 border-b border-ops-line" role="tablist" aria-label={label}>
      {items.map((f) => (
        <button
          key={f.id}
          type="button"
          role="tab"
          aria-selected={value === f.id}
          onClick={() => onChange(f.id)}
          className={`-mb-px border-b-2 pb-1.5 text-xs transition ${
            value === f.id
              ? "border-ops-link text-ops-text"
              : "border-transparent text-ops-muted hover:text-ops-text"
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [digestLoading, setDigestLoading] = useState(false);
  const booted = useRef(false);
  const commandRef = useRef<HTMLInputElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<ConsoleToolbarHandle>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    setTriageMap(loadTriageState());
    setPins(loadPins());
    if (!isOnboardingDone()) setShowOnboarding(true);
  }, []);

  const dismissOnboarding = useCallback(() => {
    markOnboardingDone();
    setShowOnboarding(false);
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

  const runDigest = useCallback(async (): Promise<boolean> => {
    setError(null);
    setDigestLoading(true);
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
      return true;
    } catch {
      setError("Digest failed — check connection and retry.");
      return false;
    } finally {
      setDigestLoading(false);
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

  const topQueueId = filtered[0]?.id ?? null;

  const selectTopQueueItem = useCallback(() => {
    if (topQueueId) selectDeployment(topQueueId);
  }, [topQueueId, selectDeployment]);

  return (
    <>
      <ShiftOnboarding
        open={showOnboarding}
        topItemId={topQueueId}
        digestLoading={digestLoading}
        onSkip={dismissOnboarding}
        onComplete={dismissOnboarding}
        onRunDigest={runDigest}
        onSelectTopItem={selectTopQueueItem}
        onOpenHandoff={() => toolbarRef.current?.openHandoff()}
      />
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

      <div className="grid min-h-[calc(100vh-3.5rem)] grid-cols-1 lg:grid-cols-[minmax(240px,320px)_1fr]">
        {trancheFilter && (
          <div className="col-span-full border-b border-ops-critical/30 bg-ops-critical/5 px-4 py-2 font-mono text-xs text-ops-critical lg:col-span-2">
            GFA tranche {trancheFilter} — {filtered.length} in queue
          </div>
        )}

        <div className="border-b border-ops-line p-3 lg:hidden">
          <button
            type="button"
            onClick={() => setQueueOpen((o) => !o)}
            className="ops-btn-ghost w-full text-left"
            aria-expanded={queueOpen}
          >
            Risk queue ({filtered.length}) {queueOpen ? "▲" : "▼"}
          </button>
        </div>

        <aside
          className={`flex flex-col border-b border-ops-line lg:border-b-0 lg:border-r ${
            queueOpen ? "flex" : "hidden lg:flex"
          }`}
        >
          <div className="shrink-0 p-3 lg:p-4">
            <SectionLabel as="h2" className="mb-2 hidden lg:block">
              Risk queue
            </SectionLabel>
            <SegmentedFilter
              items={FILTERS}
              value={filter}
              onChange={setFilter}
              label="Queue filters"
            />
            <button
              type="button"
              onClick={() => setShowCleared((s) => !s)}
              aria-pressed={showCleared}
              className={`mt-2 text-xs transition ${
                showCleared ? "text-ops-text" : "text-ops-muted hover:text-ops-text"
              }`}
            >
              {showCleared ? "· Hide cleared" : "· Show cleared"}
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto scroll-thin">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-xs text-ops-muted lg:px-4">No deployments match filter.</p>
            ) : (
              <table className="w-full text-left text-xs" role="grid" aria-label="Risk queue">
                <thead className="sticky top-0 z-10 bg-ops-panel">
                  <tr className="border-b border-ops-line text-[10px] font-medium text-ops-muted">
                    <th scope="col" className="w-7 px-2 py-1.5" aria-label="Pin" />
                    <th scope="col" className="w-7 px-1 py-1.5">
                      #
                    </th>
                    <th scope="col" className="px-1 py-1.5">
                      ID
                    </th>
                    <th scope="col" className="hidden px-1 py-1.5 sm:table-cell">
                      Status
                    </th>
                    <th scope="col" className="px-1 py-1.5 text-right">
                      Risk
                    </th>
                    <th scope="col" className="hidden px-1 py-1.5 md:table-cell">
                      SLA
                    </th>
                    <th scope="col" className="px-2 py-1.5">
                      Name
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d, i) => {
                    const triageState = getTriageState(triageMap, d.id);
                    const triageShort =
                      TRIAGE_OPTIONS.find((o) => o.id === triageState)?.short ?? "NEW";
                    const selected = selectedId === d.id;
                    return (
                      <tr
                        key={d.id}
                        className={`group border-b border-ops-line/30 transition ${
                          selected
                            ? "border-l-2 border-l-ops-link bg-ops-elevated/60"
                            : "border-l-2 border-l-transparent hover:bg-ops-elevated/40"
                        } ${triageState === "cleared" ? "opacity-60" : ""}`}
                      >
                        <td className="px-2 py-1.5">
                          <button
                            type="button"
                            aria-label={isPinned(pins, d.id) ? `Unpin ${d.id}` : `Pin ${d.id}`}
                            aria-pressed={isPinned(pins, d.id)}
                            onClick={() => handlePinToggle(d.id)}
                            className={`font-mono text-[10px] ${
                              isPinned(pins, d.id)
                                ? "text-ops-link"
                                : "text-ops-muted opacity-0 group-hover:opacity-100"
                            }`}
                          >
                            {isPinned(pins, d.id) ? "★" : "☆"}
                          </button>
                        </td>
                        <td className="px-1 py-1.5 font-mono text-[10px] text-ops-muted">{i + 1}</td>
                        <td className="px-1 py-1.5">
                          <button
                            type="button"
                            onClick={() => selectDeployment(d.id)}
                            aria-current={selected ? "true" : undefined}
                            className="font-mono text-ops-text hover:text-ops-link"
                          >
                            {d.id}
                          </button>
                        </td>
                        <td className="hidden px-1 py-1.5 sm:table-cell">
                          <button type="button" onClick={() => selectDeployment(d.id)} className="flex items-center gap-1">
                            <StatusBadge status={d.status} />
                            <TriageBadge state={triageState} short={triageShort} />
                          </button>
                        </td>
                        <td className="px-1 py-1.5 text-right font-mono tabular-nums text-ops-critical">
                          <button type="button" onClick={() => selectDeployment(d.id)}>
                            {d.risk_score}
                          </button>
                        </td>
                        <td className="hidden px-1 py-1.5 font-mono text-[10px] md:table-cell">
                          <button type="button" onClick={() => selectDeployment(d.id)}>
                            {d.days_to_deadline !== null ? (
                              <SlaCountdown days={d.days_to_deadline} className="text-[10px]" />
                            ) : (
                              "—"
                            )}
                          </button>
                        </td>
                        <td className="max-w-[8rem] truncate px-2 py-1.5 sm:max-w-[10rem]">
                          <button
                            type="button"
                            onClick={() => selectDeployment(d.id)}
                            className="block w-full truncate text-left"
                            title={d.name}
                          >
                            {d.name}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-col">
          <ConsoleToolbar
            ref={toolbarRef}
            ranked={ranked}
            triageMap={triageMap}
            history={history}
            shiftActions={SHIFT_ACTIONS}
            onRunDigest={() => void runDigest()}
            onRunBrief={(q) => void runBrief(q)}
            onHandoffExport={showOnboarding ? dismissOnboarding : undefined}
          />

          <div className="min-h-0 flex-1 overflow-y-auto scroll-thin p-3 sm:p-4">
            {error && (
              <div
                className="mb-3 rounded-ops border border-ops-critical/40 bg-ops-critical/10 px-3 py-2 text-sm text-ops-critical"
                role="alert"
              >
                {error}
              </div>
            )}

            {loading && !latest && (
              <div className="mb-4 space-y-3" aria-busy="true">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-20 w-full" />
                <p className="text-xs text-ops-muted">Loading brief…</p>
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

            {history.length > 1 && (
              <div className="mt-4 border-t border-ops-line pt-3">
                <SectionLabel as="h3" className="mb-2 block">
                  Session audit
                </SectionLabel>
                <ul className="space-y-0.5">
                  {history.slice(1, 5).map((h) => (
                    <li
                      key={`${h.query}-${h.response.generated_at}`}
                      className="flex items-baseline gap-2 border-b border-ops-line/30 py-1 text-[11px] last:border-0"
                    >
                      <span className="shrink-0 font-mono text-ops-muted">
                        {new Date(h.response.generated_at).toLocaleTimeString()}
                      </span>
                      <span className="min-w-0 truncate">{h.query}</span>
                      <span
                        className={`shrink-0 font-mono text-[10px] ${
                          h.response.validation.ok ? "text-ops-pass" : "text-ops-critical"
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

          <BriefDock
            latest={latest}
            query={history[0]?.query ?? query}
            showTools={showTools}
            historyCount={history.length}
          />

          <div className="shrink-0 border-t border-ops-line bg-ops-panel p-3 sm:p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void runBrief(query);
              }}
              className="flex gap-2"
              role="search"
              aria-label="Run operations scenario"
            >
              <div className="flex-1">
                <input
                  ref={commandRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="run scenario…"
                  className="ops-input w-full"
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
