"use client";

import { useEffect, useState } from "react";

type StripData = {
  gapMw: number;
  exceptions: number;
  nextDeadline: string | null;
  nextDays: number | null;
};

export default function FleetKpis({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<StripData | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/fleet").then((r) => r.json()),
      fetch("/api/deployments").then((r) => r.json()),
      fetch("/api/pipeline").then((r) => r.json()),
    ])
      .then(([fleet, deps, pipe]) => {
        const upcoming = (pipe.pipeline ?? []).filter(
          (p: { days_to_deadline: number | null }) =>
            p.days_to_deadline !== null && p.days_to_deadline <= 30
        );
        const next = upcoming[0];
        setData({
          gapMw: Math.round(fleet.total_gap_mw * 10) / 10,
          exceptions: (deps.exceptions ?? []).length,
          nextDeadline: next?.deployment?.id ?? null,
          nextDays: next?.days_to_deadline ?? null,
        });
      })
      .catch(() => setData({ gapMw: 0, exceptions: 0, nextDeadline: null, nextDays: null }));
  }, []);

  if (!data) {
    return (
      <div className={`flex gap-4 ${compact ? "" : "px-4 py-2"}`} aria-hidden>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-3 w-16 animate-pulse rounded bg-ops-line/50" />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[11px] sm:gap-x-5 sm:text-xs ${
        compact ? "" : "border-b border-ops-line px-4 py-2"
      }`}
      role="status"
      aria-label="Fleet health summary"
    >
      <Kpi label="MW gap" value={`${data.gapMw}`} warn={data.gapMw > 15} />
      <Kpi label="Exceptions" value={String(data.exceptions)} warn={data.exceptions > 0} />
      <Kpi
        label="Next"
        value={
          data.nextDeadline
            ? `${data.nextDeadline}${data.nextDays !== null ? ` · ${data.nextDays}d` : ""}`
            : "—"
        }
        warn={data.nextDays !== null && data.nextDays <= 14}
      />
    </div>
  );
}

function Kpi({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap">
      <span className="text-ops-muted">{label}</span>
      <span
        className={`font-mono tabular-nums ${warn ? "text-ops-critical" : "text-ops-text"}`}
      >
        {value}
      </span>
    </span>
  );
}
