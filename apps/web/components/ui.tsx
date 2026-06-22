import type { ReactNode } from "react";

export function SectionLabel({
  children,
  className = "",
  as: Tag = "span",
}: {
  children: ReactNode;
  className?: string;
  as?: "span" | "p" | "h2" | "h3" | "label";
}) {
  return (
    <Tag className={`lo-side-label block ${className}`}>{children}</Tag>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-lg font-medium lowercase tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-ops-teal-dim">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function Panel({
  children,
  className = "",
  title,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <section className={`ops-panel p-4 ${className}`}>
      {title && (
        <SectionLabel as="h2" className="mb-3 block">
          {title}
        </SectionLabel>
      )}
      {children}
    </section>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const label =
    status === "exception" ? "Exception" : status === "watch" ? "Watch" : "OK";
  const dot =
    status === "exception"
      ? "bg-ops-critical"
      : status === "watch"
        ? "bg-ops-amber"
        : "bg-ops-pass";
  const cls =
    status === "exception"
      ? "border-ops-critical/40 bg-ops-critical/10 text-ops-critical"
      : status === "watch"
        ? "border-ops-amber/40 bg-ops-amber/10 text-ops-amber"
        : "border-ops-pass/40 bg-ops-pass/10 text-ops-pass";

  return (
    <span
      className={`inline-flex items-center gap-1 border px-1.5 py-px text-[10px] font-medium lowercase ${cls}`}
      aria-label={`Status: ${status}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} aria-hidden />
      {label}
    </span>
  );
}

export function RiskBar({ score }: { score: number }) {
  const pct = Math.min(100, score);
  const color =
    pct >= 70 ? "bg-ops-critical" : pct >= 50 ? "bg-ops-high" : "bg-ops-muted-bright";
  return (
    <div className="h-px w-full overflow-hidden bg-ops-line" aria-hidden>
      <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-ops bg-ops-line/40 ${className}`} />;
}

const TRIAGE_BADGE: Record<string, string> = {
  unacked: "border-ops-line text-ops-muted",
  acknowledged: "border-ops-pass/40 bg-ops-pass/10 text-ops-pass",
  investigating: "border-ops-teal/40 bg-ops-teal/10 text-ops-teal-hover",
  escalated: "border-ops-critical/40 bg-ops-critical/10 text-ops-critical",
  cleared: "border-ops-line/60 bg-ops-bg text-ops-muted",
};

export function TriageBadge({
  state,
  short,
}: {
  state: string;
  short: string;
}) {
  const cls = TRIAGE_BADGE[state] ?? TRIAGE_BADGE.unacked;
  return (
    <span
      className={`border px-1 py-px font-mono text-[10px] font-semibold lowercase ${cls}`}
      aria-label={`Triage: ${state}`}
    >
      {short}
    </span>
  );
}
