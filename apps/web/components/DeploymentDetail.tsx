import { useEffect, useState } from "react";
import type { Contract, Deployment, RiskRankedDeployment, Runbook } from "@cartographer/schemas";
import {
  TRIAGE_OPTIONS,
  type TriageRecord,
  type TriageState,
} from "@/lib/triage-state";
import { Panel, RiskBar, Skeleton, StatusBadge, TriageBadge } from "./ui";

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
};

export default function DeploymentDetail({
  data,
  loading,
  onGenerateBrief,
  briefLoading,
  triage,
  triageState = "unacked",
  onTriageChange,
}: Props) {
  const [noteDraft, setNoteDraft] = useState(triage?.note ?? "");

  useEffect(() => {
    setNoteDraft(triage?.note ?? "");
  }, [data?.deployment.id, triage?.note]);
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
        {onGenerateBrief && (
          <button
            type="button"
            onClick={onGenerateBrief}
            disabled={briefLoading}
            className="ops-btn-primary shrink-0 text-xs"
          >
            {briefLoading ? "Generating…" : "Generate brief"}
          </button>
        )}
      </div>

      {onTriageChange && (
        <div className="mb-4 rounded-ops border border-ops-line bg-ops-bg/50 px-3 py-2">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-ops-muted">
              Triage
            </p>
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
            d.commissioning_deadline
              ? days !== null && days < 0
                ? `${d.commissioning_deadline} (${Math.abs(days)}d overdue)`
                : days !== null
                  ? `${d.commissioning_deadline} (${days}d)`
                  : d.commissioning_deadline
              : "—"
          }
          warn={days !== null && days < 0}
        />
      </dl>

      {contract && (
        <div className="mb-4 rounded-ops border border-ops-line bg-ops-bg/50 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-ops-muted">
            Contract
          </p>
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
          <p className="text-[10px] font-semibold uppercase tracking-widest text-ops-critical">
            Exception
          </p>
          {d.exception_code && (
            <p className="mt-1 font-mono text-[11px] text-ops-amber">{d.exception_code}</p>
          )}
          <p className="mt-1 text-sm leading-snug">{d.exception_summary}</p>
        </div>
      )}

      {risk && (
        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-ops-muted">
              Risk score
            </span>
            <span className="font-mono text-xs tabular-nums text-ops-critical">
              {risk.risk_score}
            </span>
          </div>
          <RiskBar score={risk.risk_score} />
        </div>
      )}

      {runbook && (
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-ops-muted">
            Runbook — {runbook.title}
          </p>
          <ol className="space-y-2">
            {runbook.steps.map((step, i) => (
              <li
                key={i}
                className="flex gap-2 rounded-ops border border-ops-line bg-ops-bg/40 px-3 py-2 text-sm leading-snug"
              >
                <span className="shrink-0 font-mono text-[10px] text-ops-amber">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </Panel>
  );
}

function Fact({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-ops border border-ops-line bg-ops-bg/40 px-2.5 py-1.5">
      <dt className="text-[10px] text-ops-muted">{label}</dt>
      <dd className={`font-mono text-xs ${warn ? "text-ops-amber" : ""}`}>{value}</dd>
    </div>
  );
}
