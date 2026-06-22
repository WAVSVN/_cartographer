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
import { riskClassName } from "@/lib/risk-display";
import { isOnboardingDone, markOnboardingDone } from "@/lib/onboarding";
import { logAudit } from "@/lib/audit-log";
import { FILTERS as FILTER_LABELS, QUEUE } from "@/lib/ui-copy";
import BriefDock from "./BriefDock";
import CommandPalette from "./CommandPalette";
import ConsoleToolbar, { type ConsoleToolbarHandle } from "./ConsoleToolbar";
import DeploymentDetail, { type DeploymentDetailData } from "./DeploymentDetail";
import OverdueAlertStrip from "./OverdueAlertStrip";
import ShiftOnboarding from "./ShiftOnboarding";
import ShortcutsHelp from "./ShortcutsHelp";
import SlaCountdown from "./SlaCountdown";
import { Skeleton, StatusBadge, TriageBadge } from "./ui";

const REFRESH_MS = 5 * 60 * 1000;

const SHIFT_ACTIONS = [
  { step: 1, label: "Shift summary", query: "Morning ops digest", digest: true },
  { step: 2, label: "Lea County site", query: "What's wrong with the Lea County site?" },
  { step: 3, label: "Slip impact check", query: "If BRG-1102 slips 4 weeks, who breaches SLA?" },
  { step: 4, label: "Fleet MW gap", query: "How much MW gap do we have?" },
  { step: 5, label: "Deadlines soon", query: "Any commissioning deadlines due soon?" },
];

type QueueFilter = "all" | "exception" | "watch" | "overdue" | "my-triage";

const FILTER_ORDER: QueueFilter[] = ["all", "exception", "watch", "overdue", "my-triage"];

const FILTERS: { id: QueueFilter; label: string }[] = [
  { id: "all", label: FILTER_LABELS.all },
  { id: "exception", label: FILTER_LABELS.exception },
  { id: "watch", label: FILTER_LABELS.watch },
  { id: "overdue", label: FILTER_LABELS.overdue },
  { id: "my-triage", label: FILTER_LABELS.myTriage },
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
          className={`ld-filter-tab ${value === f.id ? "ld-filter-tab--active" : ""}`}
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
  const [useLlm, setUseLlm] = useState(false);
  const booted = useRef(false);
  const commandRef = useRef<HTMLInputElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const queueScrollRef = useRef<HTMLDivElement>(null);
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
      logAudit({
        action: "triage_change",
        deployment_id: deploymentId,
        detail: `${update.state}${update.note ? ` — ${update.note}` : ""}`,
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
          body: JSON.stringify({
            query: trimmed,
            context: selectedId ? { selected_deployment_id: selectedId } : undefined,
            mode: useLlm ? "llm" : "planner",
          }),
        });
        if (!res.ok) throw new Error("Brief request failed");
        const data: BriefResponse = await res.json();
        if (!data.brief) throw new Error("Invalid brief response");
        pushResponse(trimmed, data);
        logAudit({
          action: "brief_run",
          deployment_id: selectedId ?? undefined,
          detail: trimmed.slice(0, 240),
          meta: {
            intent: data.meta?.intent ?? "unknown",
            mode: data.meta?.mode ?? "planner",
            valid: data.validation.ok,
          },
        });
        const idMatch = trimmed.match(/\b(BRG|PRM)-\d{4}\b/i);
        if (idMatch) setSelectedId(idMatch[0].toUpperCase());
      } catch {
        setError("Query failed — check connection and retry.");
      } finally {
        setLoading(false);
      }
    },
    [pushResponse, selectedId, useLlm]
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
      logAudit({ action: "digest_run", detail: "Morning ops digest" });
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
    void runBrief(`What's the status on ${selectedId}?`);
  }, [selectedId, runBrief]);

  const selectDeployment = useCallback((id: string) => {
    setSelectedId(id);
    setDetailFocused(false);
    setQueueOpen(false);
  }, []);

  const handlePinToggle = useCallback((deploymentId: string) => {
    setPins((prev) => {
      const pinned = isPinned(prev, deploymentId);
      const next = togglePin(prev, deploymentId);
      savePins(next);
      logAudit({
        action: "pin_toggle",
        deployment_id: deploymentId,
        detail: pinned ? "unpinned" : "pinned",
      });
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

  const cycleFilter = useCallback((delta: number) => {
    setFilter((current) => {
      const idx = FILTER_ORDER.indexOf(current);
      return FILTER_ORDER[(idx + delta + FILTER_ORDER.length) % FILTER_ORDER.length];
    });
  }, []);

  useEffect(() => {
    if (!selectedId || !queueScrollRef.current) return;
    const row = queueScrollRef.current.querySelector(`[data-queue-id="${selectedId}"]`);
    row?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedId, filtered.length]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
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

      if (showPalette || showShortcuts || showOnboarding) return;

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

      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        moveSelection(1);
        return;
      }

      if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        moveSelection(-1);
        return;
      }

      if (e.key === "[") {
        e.preventDefault();
        cycleFilter(-1);
        return;
      }

      if (e.key === "]") {
        e.preventDefault();
        cycleFilter(1);
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
  }, [
    showPalette,
    showShortcuts,
    showOnboarding,
    detailFocused,
    moveSelection,
    cycleFilter,
    generateBriefForSelected,
  ]);

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

      <div className="grid h-full grid-cols-1 overflow-hidden lg:grid-cols-[minmax(200px,260px)_1fr]">
        {trancheFilter && (
          <div className="col-span-full border-b border-ops-critical/30 bg-ops-critical/5 px-4 py-2 font-mono text-xs text-ops-critical lg:col-span-2">
            GFA tranche {trancheFilter} — {filtered.length} sites in queue
          </div>
        )}

        <div className="border-b border-ops-line p-3 lg:hidden">
          <button
            type="button"
            onClick={() => setQueueOpen((o) => !o)}
            className="ops-btn-ghost w-full text-left"
            aria-expanded={queueOpen}
          >
            {QUEUE.mobile} ({filtered.length}) {queueOpen ? "▲" : "▼"}
          </button>
        </div>

        <aside
          className={`flex h-full min-h-0 flex-col border-b border-ops-line lg:border-b-0 lg:border-r ${
            queueOpen ? "flex" : "hidden lg:flex"
          }`}
        >
          <div className="shrink-0 p-2 lg:px-3">
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
              className={`text-[10px] transition ${
                showCleared ? "text-ops-text" : "text-ops-muted hover:text-ops-text"
              }`}
            >
              {showCleared ? "hide cleared" : "show cleared"}
            </button>
          </div>

          <div ref={queueScrollRef} className="min-h-0 flex-1 overflow-y-auto scroll-thin">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-xs text-ops-muted lg:px-4">No deployments match filter.</p>
            ) : (
              <table className="w-full text-left text-xs" role="grid" aria-label={QUEUE.title}>
                <thead className="sticky top-0 z-10 bg-ops-panel">
                  <tr className="border-b border-ops-tree-line text-[10px] font-medium text-ops-muted-bright">
                    <th scope="col" className="w-6 px-1 py-1" aria-label="Pin" />
                    <th scope="col" className="px-1 py-1">
                      ID
                    </th>
                    <th scope="col" className="hidden px-1 py-1 sm:table-cell">
                      St
                    </th>
                    <th scope="col" className="px-1 py-1 text-right" title="Risk score">
                      #
                    </th>
                    <th scope="col" className="hidden px-1 py-1 md:table-cell" title="Days to deadline">
                      Due
                    </th>
                    <th scope="col" className="max-w-[5rem] px-1 py-1 sm:max-w-[7rem]">
                      Site
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
                        data-queue-id={d.id}
                        className={`group border-b border-ops-line/30 transition ${
                          selected
                            ? "border-l-2 border-l-ops-accent bg-ops-elevated/60"
                            : "border-l-2 border-l-transparent hover:bg-ops-elevated/40"
                        } ${triageState === "cleared" ? "opacity-60" : ""}`}
                      >
                        <td className="px-1 py-1">
                          <button
                            type="button"
                            aria-label={isPinned(pins, d.id) ? `Unpin ${d.id}` : `Pin ${d.id}`}
                            aria-pressed={isPinned(pins, d.id)}
                            onClick={() => handlePinToggle(d.id)}
                            className={`font-mono text-[10px] ${
                              isPinned(pins, d.id)
                                ? "text-ops-accent"
                                : "text-ops-muted opacity-0 group-hover:opacity-100"
                            }`}
                          >
                            {isPinned(pins, d.id) ? "★" : "·"}
                          </button>
                        </td>
                        <td className="px-1 py-1">
                          <button
                            type="button"
                            onClick={() => selectDeployment(d.id)}
                            aria-current={selected ? "true" : undefined}
                            className="font-mono text-ops-chrome hover:text-ops-green"
                          >
                            {d.id}
                          </button>
                        </td>
                        <td className="hidden px-1 py-1 sm:table-cell">
                          <button type="button" onClick={() => selectDeployment(d.id)} className="flex items-center gap-0.5">
                            <StatusBadge status={d.status} />
                            {triageState !== "unacked" && (
                              <TriageBadge state={triageState} short={triageShort} />
                            )}
                          </button>
                        </td>
                        <td className={`px-1 py-1 text-right font-mono tabular-nums ${riskClassName(d.risk_score)}`}>
                          <button type="button" onClick={() => selectDeployment(d.id)}>
                            {d.risk_score}
                          </button>
                        </td>
                        <td className="hidden px-1 py-1 font-mono text-[10px] md:table-cell">
                          <button type="button" onClick={() => selectDeployment(d.id)}>
                            {d.days_to_deadline !== null ? (
                              <SlaCountdown days={d.days_to_deadline} className="text-[10px]" />
                            ) : (
                              "—"
                            )}
                          </button>
                        </td>
                        <td className="max-w-[5rem] truncate px-1 py-1 sm:max-w-[7rem]">
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

        <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
          <ConsoleToolbar
            ref={toolbarRef}
            ranked={ranked}
            triageMap={triageMap}
            history={history}
            shiftActions={SHIFT_ACTIONS}
            onRunDigest={() => void runDigest()}
            onRunBrief={(q) => void runBrief(q)}
            onHandoffExport={showOnboarding ? dismissOnboarding : undefined}
            query={query}
            onQueryChange={setQuery}
            onSubmitQuery={() => void runBrief(query)}
            queryLoading={loading}
            commandInputRef={commandRef}
            onShowShortcuts={() => setShowShortcuts(true)}
            useLlm={useLlm}
            onUseLlmChange={setUseLlm}
          />

          <div className="min-h-0 flex-1 overflow-y-auto scroll-thin px-2 py-2 sm:px-3">
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
                <p className="text-xs text-ops-muted">Loading ops summary…</p>
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
                onRunbookCheck={(stepIndex, checked) => {
                  if (!selectedId) return;
                  logAudit({
                    action: "runbook_check",
                    deployment_id: selectedId,
                    detail: `step ${stepIndex + 1} ${checked ? "checked" : "unchecked"}`,
                  });
                }}
                onScenarioRun={(weeks, result) => {
                  if (!selectedId) return;
                  logAudit({
                    action: "scenario_run",
                    deployment_id: selectedId,
                    detail: `+${weeks}w slip — SLA ${result.sla_at_risk ? "at risk" : "ok"}`,
                  });
                }}
              />
            </div>
          </div>

          <BriefDock
            latest={latest}
            query={history[0]?.query ?? query}
            showTools={showTools}
            onToggleTools={() => setShowTools((s) => !s)}
            historyCount={history.length}
          />
        </div>
      </div>
    </>
  );
}
