import { useCallback, useEffect, useState, type ReactNode } from "react";
import type {
  Contract,
  Deployment,
  RiskRankedDeployment,
  Runbook,
  ScenarioResult,
} from "@cartographer/schemas";
import {
  isStepChecked,
  loadRunbookChecks,
  saveRunbookChecks,
  toggleStep,
  type RunbookChecksMap,
} from "@/lib/runbook-checks";
import { riskClassName } from "@/lib/risk-display";
import {
  TRIAGE_OPTIONS,
  type TriageRecord,
  type TriageState,
} from "@/lib/triage-state";
import ScenarioPanel from "./ScenarioPanel";
import SlaCountdown from "./SlaCountdown";
import { SectionLabel, Skeleton, StatusBadge, TriageBadge } from "./ui";

export type DeploymentDetailData = {
  deployment: Deployment;
  contract: Contract | null;
  runbook: Runbook | null;
  risk: RiskRankedDeployment | null;
};

type Props = {
  data: DeploymentDetailData | null;
  loading?: boolean;
  onGenerateBrief?: () => void;
  briefLoading?: boolean;
  triage?: TriageRecord | null;
  triageState?: TriageState;
  onTriageChange?: (update: { state: TriageState; note?: string }) => void;
  trancheFilter?: string | null;
  onRunbookCheck?: (stepIndex: number, checked: boolean) => void;
  onScenarioRun?: (slipWeeks: number, result: ScenarioResult) => void;
};

function buildDeployLink(deploymentId: string, tranche?: string | null): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const params = new URLSearchParams({ deploy: deploymentId });
  if (tranche) params.set("tranche", tranche);
  return `${origin}/?${params.toString()}`;
}

function Section({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`border-b border-ops-line/60 py-2 last:border-b-0 ${className}`}>{children}</section>;
}

export default function DeploymentDetail({
  data,
  loading,
  onGenerateBrief,
  briefLoading,
  triage,
  triageState = "unacked",
  onTriageChange,
  trancheFilter,
  onRunbookCheck,
  onScenarioRun,
}: Props) {
  const [noteDraft, setNoteDraft] = useState(triage?.note ?? "");
  const [runbookChecks, setRunbookChecks] = useState<RunbookChecksMap>({});
  const [scenario, setScenario] = useState<ScenarioResult | null>(null);
  const [scenarioLoading, setScenarioLoading] = useState(false);
  const [scenarioError, setScenarioError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  useEffect(() => {
    setNoteDraft(triage?.note ?? "");
  }, [data?.deployment.id, triage?.note]);

  useEffect(() => {
    setRunbookChecks(loadRunbookChecks());
  }, []);

  useEffect(() => {
    setScenario(null);
    setScenarioError(null);
  }, [data?.deployment.id]);

  const handleRunbookToggle = useCallback(
    (stepIndex: number, stepCount: number) => {
      if (!data) return;
      setRunbookChecks((prev) => {
        const wasChecked = isStepChecked(prev, data.deployment.id, stepIndex);
        const next = toggleStep(prev, data.deployment.id, stepIndex, stepCount);
        saveRunbookChecks(next);
        onRunbookCheck?.(stepIndex, !wasChecked);
        return next;
      });
    },
    [data, onRunbookCheck]
  );

  const runScenario = useCallback(
    async (slipWeeks: number) => {
      if (!data) return;
      setScenarioLoading(true);
      setScenarioError(null);
      try {
        const params = new URLSearchParams({
          deployment_id: data.deployment.id,
          slip_weeks: String(slipWeeks),
        });
        const res = await fetch(`/api/scenario?${params.toString()}`);
        if (!res.ok) throw new Error("Scenario request failed");
        const result = (await res.json()) as ScenarioResult;
        setScenario(result);
        onScenarioRun?.(slipWeeks, result);
      } catch {
        setScenarioError("Scenario failed — retry.");
        setScenario(null);
      } finally {
        setScenarioLoading(false);
      }
    },
    [data, onScenarioRun]
  );

  const copyDeployLink = useCallback(async () => {
    if (!data) return;
    const link = buildDeployLink(
      data.deployment.id,
      trancheFilter ?? data.deployment.gfa_tranche
    );
    try {
      await navigator.clipboard.writeText(link);
      setCopyFeedback("Copied");
      window.setTimeout(() => setCopyFeedback(null), 2000);
    } catch {
      setCopyFeedback("Copy failed");
      window.setTimeout(() => setCopyFeedback(null), 2000);
    }
  }, [data, trancheFilter]);

  if (loading) {
    return (
      <div className="py-2">
        <Skeleton className="mb-2 h-4 w-48" />
        <Skeleton className="mb-3 h-6 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <p className="py-4 text-sm text-ops-muted">
        Select a site from the priority queue on the left.
      </p>
    );
  }

  const { deployment: d, contract, runbook, risk } = data;
  const mwGap = d.mw_contracted - d.mw_available;
  const sla = contract?.uptime_sla_pct ?? risk?.sla_pct ?? null;
  const days = risk?.days_to_deadline ?? null;

  return (
    <div>
      <Section>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={d.status} />
              <span className="font-mono text-xs">{d.id}</span>
              {risk && (
                <span className={`font-mono text-[10px] tabular-nums ${riskClassName(risk.risk_score)}`}>
                  risk {risk.risk_score}
                </span>
              )}
            </div>
            <h2 className="mt-0.5 text-sm font-semibold">{d.name}</h2>
            <p className="text-[11px] text-ops-muted">{d.site}</p>
            {d.exception_summary && (
              <p className="mt-1 text-xs leading-snug text-ops-critical">
                {d.exception_code && (
                  <span className="font-mono text-[10px]">{d.exception_code} · </span>
                )}
                {d.exception_summary}
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => void copyDeployLink()}
              className="ops-btn-ghost px-2 py-0.5 text-[10px]"
              aria-live="polite"
            >
              {copyFeedback ?? "link"}
            </button>
            {onGenerateBrief && (
              <button
                type="button"
                onClick={onGenerateBrief}
                disabled={briefLoading}
                className="ops-btn-primary px-2 py-0.5 text-[10px]"
              >
                {briefLoading ? "…" : "summary"}
              </button>
            )}
          </div>
        </div>
      </Section>

      {onTriageChange && (
        <Section>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <SectionLabel>Triage</SectionLabel>
            <TriageBadge
              state={triageState}
              short={TRIAGE_OPTIONS.find((o) => o.id === triageState)?.short ?? "NEW"}
            />
          </div>
          <div className="flex flex-wrap gap-3 border-b border-ops-line" role="group" aria-label="Triage state">
            {TRIAGE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                aria-pressed={triageState === opt.id}
                onClick={() =>
                  onTriageChange({
                    state: opt.id,
                    note: noteDraft.trim() || undefined,
                  })
                }
                className={`ld-filter-tab ${triageState === opt.id ? "ld-filter-tab--active" : ""}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <label className="mt-2 block">
            <span className="sr-only">Triage note</span>
            <input
              type="text"
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              onBlur={() => {
                if (triageState !== "unacked" || noteDraft.trim()) {
                  onTriageChange({
                    state: triageState,
                    note: noteDraft.trim() || undefined,
                  });
                }
              }}
              placeholder="Note (optional)"
              maxLength={120}
              className="ops-input mt-1.5 w-full text-xs"
            />
          </label>
        </Section>
      )}

      <Section>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] sm:grid-cols-3 lg:grid-cols-4">
          <Fact label="MW contracted" value={`${d.mw_contracted}`} />
          <Fact label="MW available" value={`${d.mw_available}`} warn={mwGap > 0} />
          <Fact label="MW gap" value={`${mwGap}`} warn={mwGap > 0} />
          <Fact label="SLA" value={sla !== null ? `${sla}%` : "—"} />
          {contract && <Fact label="Customer" value={contract.customer} />}
          <Fact label="Equipment" value={d.equipment} />
          <Fact label="GFA" value={d.gfa_tranche} title="Grid facility agreement tranche" />
          <Fact label="Type" value={d.type} />
          <Fact
            label="Deadline"
            value={
              d.commissioning_deadline ? (
                <span>
                  {d.commissioning_deadline}
                  {days !== null && (
                    <>
                      {" ("}
                      <SlaCountdown days={days} />
                      {")"}
                    </>
                  )}
                </span>
              ) : (
                "—"
              )
            }
            warn={days !== null && days < 0}
          />
        </dl>
      </Section>

      {runbook && (
        <Section className="border-b-0">
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <SectionLabel>{runbook.title}</SectionLabel>
            <div className="flex gap-1" role="group" aria-label="Model deadline slip">
              <button
                type="button"
                disabled={scenarioLoading}
                onClick={() => void runScenario(2)}
                className="ops-btn-ghost px-2 py-0.5 font-mono text-[10px]"
                title="What if commissioning slips 2 weeks?"
              >
                +2w slip
              </button>
              <button
                type="button"
                disabled={scenarioLoading}
                onClick={() => void runScenario(4)}
                className="ops-btn-ghost px-2 py-0.5 font-mono text-[10px]"
                title="What if commissioning slips 4 weeks?"
              >
                +4w slip
              </button>
            </div>
          </div>
          <ol className="space-y-1">
            {runbook.steps.map((step, i) => {
              const checked = isStepChecked(runbookChecks, d.id, i);
              return (
                <li
                  key={i}
                  className={`flex gap-2 border-b border-ops-line/30 px-0.5 py-1 text-xs leading-snug last:border-0 ${
                    checked ? "text-ops-muted" : ""
                  }`}
                >
                  <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleRunbookToggle(i, runbook.steps.length)}
                      className="mt-0.5 shrink-0 accent-ops-teal"
                    />
                    <span className="shrink-0 font-mono text-[10px] text-ops-muted">{i + 1}</span>
                    <span className={checked ? "line-through" : undefined}>{step}</span>
                  </label>
                </li>
              );
            })}
          </ol>
          {scenarioError && (
            <p className="mt-2 text-xs text-ops-critical">{scenarioError}</p>
          )}
          {scenario && <ScenarioPanel result={scenario} loading={scenarioLoading} />}
        </Section>
      )}
    </div>
  );
}

function Fact({
  label,
  value,
  warn,
  title,
}: {
  label: string;
  value: ReactNode;
  warn?: boolean;
  title?: string;
}) {
  return (
    <div className="border-b border-ops-line/30 pb-1" title={title}>
      <dt className="text-[9px] uppercase tracking-wide text-ops-muted">{label}</dt>
      <dd className={`font-mono text-xs ${warn ? "text-ops-critical" : ""}`}>{value}</dd>
    </div>
  );
}
