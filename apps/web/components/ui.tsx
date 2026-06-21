import type { ReactNode } from "react";

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
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-ops-muted">{subtitle}</p>}
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
        <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-ops-muted">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const code =
    status === "exception" ? "EXC" : status === "watch" ? "WCH" : "OK";
  const cls =
    status === "exception"
      ? "border-ops-critical/40 bg-ops-critical/10 text-ops-critical"
      : status === "watch"
        ? "border-ops-amber/40 bg-ops-amber/10 text-ops-amber"
        : "border-ops-pass/40 bg-ops-pass/10 text-ops-pass";

  return (
    <span
      className={`rounded border px-1 py-px font-mono text-[10px] font-semibold ${cls}`}
      aria-label={`Status: ${status}`}
    >
      {code}
    </span>
  );
}

export function RiskBar({ score }: { score: number }) {
  const pct = Math.min(100, score);
  const color =
    pct >= 70 ? "bg-ops-critical" : pct >= 50 ? "bg-ops-high" : "bg-ops-amber";
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-ops-bg" aria-hidden>
      <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-ops bg-ops-line/40 ${className}`} />;
}
