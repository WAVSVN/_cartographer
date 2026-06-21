import type { ScenarioResult } from "@cartographer/schemas";
import { SectionLabel } from "./ui";

type Props = {
  result: ScenarioResult;
  loading?: boolean;
};

export default function ScenarioPanel({ result, loading }: Props) {
  return (
    <div
      className={`mt-3 rounded-ops border px-3 py-2 ${
        result.sla_at_risk
          ? "border-ops-critical/40 bg-ops-critical/5"
          : "border-ops-line bg-ops-bg/40"
      }`}
      aria-busy={loading}
    >
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <SectionLabel>Slip scenario — {result.slip_weeks}w</SectionLabel>
        {result.sla_at_risk && (
          <span className="font-mono text-[10px] text-ops-critical">SLA at risk</span>
        )}
      </div>
      <p className="text-sm leading-snug">{result.summary}</p>
      <dl className="mt-2 grid gap-1 sm:grid-cols-3">
        <div>
          <dt className="text-[10px] text-ops-muted">Original</dt>
          <dd className="font-mono text-[11px]">{result.original_deadline ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-[10px] text-ops-muted">Adjusted</dt>
          <dd className="font-mono text-[11px]">{result.adjusted_deadline ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-[10px] text-ops-muted">Affected MW</dt>
          <dd className="font-mono text-[11px]">{result.affected_mw}</dd>
        </div>
      </dl>
    </div>
  );
}
