import type { BriefResponse } from "@/lib/types";

function severityClass(s: string) {
  switch (s) {
    case "critical":
      return "text-ops-critical border-ops-critical/40 bg-ops-critical/10";
    case "high":
      return "text-ops-high border-ops-high/40 bg-ops-high/10";
    case "medium":
      return "text-ops-amber border-ops-amber/40 bg-ops-amber/10";
    default:
      return "text-ops-pass border-ops-pass/40 bg-ops-pass/10";
  }
}

export default function BriefCard({
  response,
  showTools = false,
  title,
}: {
  response: BriefResponse;
  showTools?: boolean;
  title?: string;
}) {
  const { brief, validation, tools } = response;

  return (
    <article className="ops-panel" aria-live="polite" aria-label="Operations brief">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ops-line px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {title && (
            <span className="text-[10px] font-semibold uppercase tracking-widest text-ops-muted">
              {title}
            </span>
          )}
          <span
            className={`rounded-ops border px-2 py-0.5 text-[10px] font-semibold uppercase ${severityClass(brief.severity)}`}
          >
            {brief.severity}
          </span>
          <span
            className={`rounded-ops border px-2 py-0.5 font-mono text-[10px] ${
              validation.ok
                ? "border-ops-pass/40 text-ops-pass"
                : "border-ops-critical/40 text-ops-critical"
            }`}
          >
            {validation.ok ? "VALID" : "INVALID"}
          </span>
        </div>
        <time className="font-mono text-[10px] text-ops-muted" dateTime={response.generated_at}>
          {new Date(response.generated_at).toLocaleString()}
        </time>
      </div>

      <div className="space-y-4 p-4">
        <p className="text-sm leading-relaxed text-ops-text/95">{brief.summary}</p>

        {brief.recommended_actions.length > 0 && (
          <div>
            <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-ops-muted">
              Recommended actions
            </h3>
            <ol className="list-decimal space-y-1 pl-4 text-sm text-ops-text/90">
              {brief.recommended_actions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ol>
          </div>
        )}

        <div>
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-ops-muted">
            Citations
          </h3>
          <ul className="space-y-1 font-mono text-[11px]">
            {brief.citations.map((c, i) => (
              <li key={`${c.source}-${i}`} className="rounded-ops bg-ops-bg px-2 py-1">
                {c.deployment_id && <span className="text-ops-amber">{c.deployment_id} </span>}
                {c.exception_code && <span>{c.exception_code} </span>}
                <span className="text-ops-muted">← {c.source}</span>
              </li>
            ))}
          </ul>
        </div>

        {!validation.ok && (
          <div
            className="rounded-ops border border-ops-critical/40 bg-ops-critical/5 p-3 text-sm text-ops-critical"
            role="alert"
          >
            {validation.errors.map((e) => (
              <p key={e}>{e}</p>
            ))}
          </div>
        )}

        {showTools && tools.length > 0 && (
          <details className="group">
            <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-widest text-ops-muted">
              Tool trace ({tools.length})
            </summary>
            <pre className="mt-2 max-h-48 overflow-auto rounded-ops border border-ops-line bg-ops-bg p-3 font-mono text-[10px] text-ops-muted scroll-thin">
              {JSON.stringify(tools, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </article>
  );
}
