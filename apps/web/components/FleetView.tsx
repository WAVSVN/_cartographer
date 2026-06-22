"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FleetSummary } from "@/lib/types";
import { PageHeader, SectionLabel, Skeleton } from "./ui";

function MwBar({
  label,
  contracted,
  available,
}: {
  label: string;
  contracted: number;
  available: number;
}) {
  const gap = contracted - available;
  const availPct = contracted > 0 ? (available / contracted) * 100 : 0;
  const gapPct = contracted > 0 ? (gap / contracted) * 100 : 0;

  return (
    <div>
      <div className="mb-1 flex justify-between font-mono text-[11px]">
        <span className="text-ops-muted">{label}</span>
        <span>
          <span className="text-ops-pass">{available}</span>
          <span className="text-ops-muted"> / </span>
          {contracted}
          <span className="text-ops-muted"> MW</span>
          {gap > 0 && <span className="ml-2 text-ops-critical">−{gap.toFixed(1)}</span>}
        </span>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full bg-ops-bg">
        <div className="bg-ops-pass/80 transition-all" style={{ width: `${availPct}%` }} />
        <div className="bg-ops-critical/50" style={{ width: `${gapPct}%` }} />
      </div>
    </div>
  );
}

export default function FleetView() {
  const [fleet, setFleet] = useState<FleetSummary | null>(null);

  useEffect(() => {
    fetch("/api/fleet")
      .then((r) => r.json())
      .then(setFleet);
  }, []);

  if (!fleet) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>
    );
  }

  const tranches = Object.entries(fleet.by_tranche).sort(([a], [b]) => a.localeCompare(b));
  const gapPct = fleet.total_contracted_mw
    ? Math.round((fleet.total_gap_mw / fleet.total_contracted_mw) * 100)
    : 0;

  return (
    <div className="space-y-5 p-4">
      <PageHeader
        title="Fleet capacity"
        subtitle={`${gapPct}% megawatt shortfall across demo fleet · GFA = grid facility agreement`}
      />

      <div className="grid gap-3 border-b border-ops-line pb-5 sm:grid-cols-3">
        <StatCard label="Contracted" value={`${fleet.total_contracted_mw}`} unit="MW" />
        <StatCard label="Available" value={`${fleet.total_available_mw}`} unit="MW" />
        <StatCard label="Shortfall" value={`${fleet.total_gap_mw.toFixed(1)}`} unit="MW" accent />
      </div>

      <div className="grid gap-6 border-b border-ops-line pb-5 lg:grid-cols-2">
        <div>
          <SectionLabel as="h2" className="mb-3 block">
            Bridge vs permanent
          </SectionLabel>
          <div className="space-y-4">
            <MwBar
              label="Bridge"
              contracted={fleet.by_type.bridge.contracted_mw}
              available={fleet.by_type.bridge.available_mw}
            />
            <MwBar
              label="Permanent"
              contracted={fleet.by_type.permanent.contracted_mw}
              available={fleet.by_type.permanent.available_mw}
            />
          </div>
        </div>

        <div>
          <SectionLabel as="h2" className="mb-3 block">
            By basin
          </SectionLabel>
          <div className="space-y-4">
            {Object.entries(fleet.by_basin).map(([basin, b]) => (
              <MwBar key={basin} label={basin} contracted={b.contracted_mw} available={b.available_mw} />
            ))}
          </div>
        </div>
      </div>

      <div>
        <SectionLabel as="h2" className="mb-3 block">
          By agreement tranche (GFA)
        </SectionLabel>
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full text-left text-sm" role="table">
            <thead>
              <tr className="border-b border-ops-line text-xs font-medium text-ops-muted">
                <th scope="col" className="pb-2 pr-4">
                  Tranche
                </th>
                <th scope="col" className="pb-2 pr-4">
                  Contracted
                </th>
                <th scope="col" className="pb-2 pr-4">
                  Available
                </th>
                <th scope="col" className="pb-2 pr-4">
                  Gap
                </th>
                <th scope="col" className="pb-2">
                  In trouble
                </th>
              </tr>
            </thead>
            <tbody>
              {tranches.map(([t, row]) => (
                <tr key={t} className="border-b border-ops-line/40">
                  <td className="py-2 font-mono text-xs text-ops-text">{t}</td>
                  <td className="py-2 font-mono text-xs">{row.contracted_mw}</td>
                  <td className="py-2 font-mono text-xs">{row.available_mw}</td>
                  <td className={`py-2 font-mono text-xs ${row.gap_mw > 0 ? "text-ops-critical" : "text-ops-muted-bright"}`}>
                    {row.gap_mw.toFixed(1)}
                  </td>
                  <td className="py-2">
                    {row.stressed_count > 0 ? (
                      <Link
                        href={`/?tranche=${encodeURIComponent(t)}`}
                        className="font-mono text-xs text-ops-link hover:underline"
                      >
                        View {row.stressed_count}
                      </Link>
                    ) : (
                      <span className="font-mono text-xs text-ops-pass">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: string;
  unit: string;
  accent?: boolean;
}) {
  return (
    <div>
      <SectionLabel className="block">{label}</SectionLabel>
      <p className={`mt-1 font-mono text-2xl font-semibold tabular-nums ${accent ? "text-ops-critical" : ""}`}>
        {value}
        <span className="ml-1 text-sm font-normal text-ops-muted">{unit}</span>
      </p>
    </div>
  );
}
