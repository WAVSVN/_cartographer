import type { BriefResponse } from "@/lib/types";
import { SectionLabel } from "./ui";

function severityBorder(s: string) {
  switch (s) {
    case "critical":
      return "border-l-ops-critical";
    case "high":
      return "border-l-ops-high";
    case "medium":
      return "border-l-ops-muted-bright";
    default:
      return "border-l-ops-pass";
  }
}

function severityText(s: string) {
  switch (s) {
    case "critical":
      return "text-ops-critical";
    case "high":
      return "text-ops-high";
    case "medium":
      return "text-ops-muted-bright";
    default:
      return "text-ops-pass";
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
  const { brief, validation, tools, meta } = response;

  return (
    <article
      className={`ops-panel border-l-4 ${severityBorder(brief.severity)}`}
      aria-live="polite"
      aria-label="Operations brief"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ops-line px-3 py-1.5">
        <div className="flex flex-wrap items-center gap-2">
          {title && <SectionLabel>{title}</SectionLabel>}
          <span className={`text-xs font-medium capitalize ${severityText(brief.severity)}`}>
            {brief.severity}
          </span>
          {!validation.ok && (
            <span className="rounded-ops border border-ops-critical/40 px-2 py-0.5 text-xs font-medium text-ops-critical">
              Invalid
            </span>
          )}
          {meta && (
            <span className="font-mono text-[10px] text-ops-muted">
              {meta.mode}
              {meta.intent ? ` · ${meta.intent}` : ""}
            </span>
          )}
        </div>
        <time className="font-mono text-[10px] text-ops-muted" dateTime={response.generated_at}>
          {new Date(response.generated_at).toLocaleString()}
        </time>
      </div>

      <div className="space-y-2 p-3">
        <p className="text-xs leading-relaxed text-ops-text/95">{brief.summary}</p>

        {brief.recommended_actions.length > 0 && (
          <div>
            <SectionLabel as="h3" className="mb-2 block">
              Next steps
            </SectionLabel>
            <ol className="list-decimal space-y-1 pl-4 text-sm text-ops-text/90">
              {brief.recommended_actions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ol>
          </div>
        )}

        <div>
          <SectionLabel as="h3" className="mb-2 block">
            Sources
          </SectionLabel>
          <ul className="space-y-1 font-mono text-[11px]">
            {brief.citations.map((c, i) => (
              <li key={`${c.source}-${i}`} className="rounded-ops bg-ops-bg px-2 py-1">
                {c.deployment_id && <span className="text-ops-teal-hover">{c.deployment_id} </span>}
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
            <summary className="cursor-pointer">
              <SectionLabel>How this answer was built ({tools.length})</SectionLabel>
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
