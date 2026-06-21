"use client";

import { useEffect, useState } from "react";

type StripData = {
  gapMw: number;
  exceptions: number;
  nextDeadline: string | null;
  nextDays: number | null;
};

export default function FleetHealthStrip() {
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
      <div className="border-b border-ops-line bg-ops-elevated/80 px-4 py-2" aria-hidden>
        <div className="mx-auto flex max-w-7xl gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-4 w-24 animate-pulse rounded bg-ops-line/50" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="border-b border-ops-line bg-ops-elevated/90 px-4 py-2"
      role="status"
      aria-label="Fleet health summary"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-1 text-xs">
        <Kpi label="MW gap" value={`${data.gapMw}`} warn={data.gapMw > 15} />
        <Kpi label="Exceptions" value={String(data.exceptions)} warn={data.exceptions > 0} />
        <Kpi
          label="Next deadline"
          value={
            data.nextDeadline
              ? `${data.nextDeadline}${data.nextDays !== null ? ` · ${data.nextDays}d` : ""}`
              : "—"
          }
          warn={data.nextDays !== null && data.nextDays <= 14}
        />
      </div>
    </div>
  );
}

function Kpi({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span className="text-ops-muted">{label}</span>
      <span className={`font-mono tabular-nums ${warn ? "text-ops-amber" : "text-ops-text"}`}>
        {value}
      </span>
    </span>
  );
}
