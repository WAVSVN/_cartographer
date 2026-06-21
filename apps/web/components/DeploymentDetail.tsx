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
import {
  TRIAGE_OPTIONS,
  type TriageRecord,
  type TriageState,
} from "@/lib/triage-state";
import ScenarioPanel from "./ScenarioPanel";
import SlaCountdown from "./SlaCountdown";
import { Panel, RiskBar, SectionLabel, Skeleton, StatusBadge, TriageBadge } from "./ui";



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
};



function buildDeployLink(deploymentId: string, tranche?: string | null): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const params = new URLSearchParams({ deploy: deploymentId });
  if (tranche) params.set("tranche", tranche);
  return `${origin}/?${params.toString()}`;
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
        const next = toggleStep(prev, data.deployment.id, stepIndex, stepCount);
        saveRunbookChecks(next);
        return next;
      });
    },
    [data]
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
      } catch {
        setScenarioError("Scenario failed — retry.");
        setScenario(null);
      } finally {
        setScenarioLoading(false);
      }
    },
    [data]
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
      <Panel title="Deployment detail" className="mb-4">
        <Skeleton className="mb-2 h-4 w-48" />
        <Skeleton className="mb-3 h-6 w-full" />
        <Skeleton className="h-16 w-full" />
      </Panel>
    );
  }



  if (!data) {
    return (
      <Panel title="Deployment detail" className="mb-4">
        <p className="text-sm text-ops-muted">Select a deployment from the risk queue.</p>
      </Panel>
    );
  }



  const { deployment: d, contract, runbook, risk } = data;
  const mwGap = d.mw_contracted - d.mw_available;
  const sla = contract?.uptime_sla_pct ?? risk?.sla_pct ?? null;
  const days = risk?.days_to_deadline ?? null;



  return (
    <Panel title="Deployment detail" className="mb-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <StatusBadge status={d.status} />
            <span className="font-mono text-xs text-ops-amber">{d.id}</span>
          </div>
          <h2 className="mt-1 text-base font-semibold">{d.name}</h2>
          <p className="text-xs text-ops-muted">{d.site}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void copyDeployLink()}
            className="ops-btn-ghost text-xs"
            aria-live="polite"
          >
            {copyFeedback ?? "Copy link"}
          </button>
          {onGenerateBrief && (
            <button
              type="button"
              onClick={onGenerateBrief}
              disabled={briefLoading}
              className="ops-btn-primary text-xs"
            >
              {briefLoading ? "Loading brief…" : "Generate brief"}
            </button>
          )}
        </div>
      </div>



      {onTriageChange && (
        <div className="mb-4 rounded-ops border border-ops-line bg-ops-bg/50 px-3 py-2">
          <div className="mb-2 flex items-center justify-between gap-2">
            <SectionLabel>Triage</SectionLabel>
            <TriageBadge
              state={triageState}
              short={TRIAGE_OPTIONS.find((o) => o.id === triageState)?.short ?? "NEW"}
            />
          </div>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Triage state">
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
                className={`rounded-ops border px-2 py-0.5 font-mono text-[10px] transition ${
                  triageState === opt.id
                    ? "border-ops-amber/50 bg-ops-amber/10 text-ops-amber"
                    : "border-ops-line text-ops-muted hover:border-ops-amber/30"
                }`}
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
              placeholder="Short note (optional)"
              maxLength={120}
              className="ops-input mt-1 w-full text-xs"
            />
          </label>
          {triage?.updatedAt && (
            <p className="mt-1 font-mono text-[10px] text-ops-muted">
              Updated {new Date(triage.updatedAt).toLocaleString()}
            </p>
          )}
        </div>
      )}



      <dl className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Fact label="MW contracted" value={`${d.mw_contracted}`} />
        <Fact label="MW available" value={`${d.mw_available}`} warn={mwGap > 0} />
        <Fact label="MW gap" value={`${mwGap}`} warn={mwGap > 0} />
        <Fact label="SLA" value={sla !== null ? `${sla}%` : "—"} />
        <Fact label="Equipment" value={d.equipment} />
        <Fact label="GFA tranche" value={d.gfa_tranche} />
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



      {contract && (
        <div className="mb-4 rounded-ops border border-ops-line bg-ops-bg/50 px-3 py-2">
          <SectionLabel className="block">Contract</SectionLabel>
          <p className="mt-1 text-sm">{contract.customer}</p>
          <p className="mt-0.5 font-mono text-[11px] text-ops-muted">
            {contract.term_years}y · SLA {contract.uptime_sla_pct}%
            {contract.bridge_to_permanent ? " · bridge→permanent" : ""}
          </p>
          {contract.notes && (
            <p className="mt-1 text-xs text-ops-muted">{contract.notes}</p>
          )}
        </div>
      )}



      {d.exception_summary && (
        <div className="mb-4 rounded-ops border border-ops-critical/30 bg-ops-critical/5 px-3 py-2">
          <SectionLabel className="block text-ops-critical">Exception</SectionLabel>
          {d.exception_code && (
            <p className="mt-1 font-mono text-[11px] text-ops-amber">{d.exception_code}</p>
          )}
          <p className="mt-1 text-sm leading-snug">{d.exception_summary}</p>
        </div>
      )}



      {risk && (
        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between">
            <SectionLabel>Risk score</SectionLabel>
            <span className="font-mono text-xs tabular-nums text-ops-critical">
              {risk.risk_score}
            </span>
          </div>
          <RiskBar score={risk.risk_score} />
        </div>
      )}



      {runbook && (
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <SectionLabel>Runbook — {runbook.title}</SectionLabel>
            <div className="flex gap-1" role="group" aria-label="Quick slip scenarios">
              <button
                type="button"
                disabled={scenarioLoading}
                onClick={() => void runScenario(2)}
                className="rounded-ops border border-ops-line px-2 py-0.5 font-mono text-[10px] text-ops-muted transition hover:border-ops-amber/30 hover:text-ops-amber disabled:opacity-50"
              >
                +2w
              </button>
              <button
                type="button"
                disabled={scenarioLoading}
                onClick={() => void runScenario(4)}
                className="rounded-ops border border-ops-line px-2 py-0.5 font-mono text-[10px] text-ops-muted transition hover:border-ops-amber/30 hover:text-ops-amber disabled:opacity-50"
              >
                +4w
              </button>
            </div>
          </div>
          <ol className="space-y-2">
            {runbook.steps.map((step, i) => {
              const checked = isStepChecked(runbookChecks, d.id, i);
              return (
                <li
                  key={i}
                  className={`flex gap-2 rounded-ops border px-3 py-2 text-sm leading-snug ${
                    checked
                      ? "border-ops-pass/30 bg-ops-pass/5 text-ops-muted"
                      : "border-ops-line bg-ops-bg/40"
                  }`}
                >
                  <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleRunbookToggle(i, runbook.steps.length)}
                      className="mt-0.5 shrink-0 accent-ops-amber"
                    />
                    <span className="shrink-0 font-mono text-[10px] text-ops-amber">{i + 1}</span>
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
        </div>
      )}
    </Panel>
  );
}



function Fact({ label, value, warn }: { label: string; value: ReactNode; warn?: boolean }) {
  return (
    <div className="rounded-ops border border-ops-line bg-ops-bg/40 px-2.5 py-1.5">
      <dt className="text-[10px] text-ops-muted">{label}</dt>
      <dd className={`font-mono text-xs ${warn ? "text-ops-amber" : ""}`}>{value}</dd>
    </div>
  );
}



