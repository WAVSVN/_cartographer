"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PipelineItem } from "@/lib/types";
import { PageHeader, Panel, RiskBar, Skeleton, StatusBadge } from "./ui";

export default function PipelineView() {
  const [items, setItems] = useState<PipelineItem[] | null>(null);

  useEffect(() => {
    fetch("/api/pipeline")
      .then((r) => r.json())
      .then((d) => setItems(d.pipeline ?? []));
  }, []);

  if (!items) {
    return (
      <div className="mx-auto max-w-7xl p-4">
        <Skeleton className="mb-4 h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4">
      <PageHeader
        title="Bridge → Permanent Pipeline"
        subtitle={`${items.length} transitions tracked`}
      />

      <div className="space-y-2 md:hidden">
        {items.map((p) => (
          <PipelineCard key={p.deployment.id} item={p} />
        ))}
      </div>

      <Panel className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm" role="table">
          <thead>
            <tr className="border-b border-ops-line text-[10px] uppercase tracking-wider text-ops-muted">
              <th scope="col" className="p-2">
                ID
              </th>
              <th scope="col" className="p-2">
                Customer
              </th>
              <th scope="col" className="p-2">
                Type
              </th>
              <th scope="col" className="p-2">
                Deadline
              </th>
              <th scope="col" className="p-2">
                Days
              </th>
              <th scope="col" className="p-2">
                Gap
              </th>
              <th scope="col" className="p-2">
                Risk
              </th>
              <th scope="col" className="p-2">
                Flags
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr
                key={p.deployment.id}
                className="border-b border-ops-line/40 hover:bg-ops-elevated/50"
              >
                <td className="p-2">
                  <Link
                    href={`/?deploy=${p.deployment.id}`}
                    className="font-mono text-xs text-ops-amber hover:underline"
                  >
                    {p.deployment.id}
                  </Link>
                </td>
                <td className="p-2 text-xs">{p.customer}</td>
                <td className="p-2 text-xs capitalize">{p.deployment.type}</td>
                <td className="p-2 font-mono text-[11px]">
                  {p.deployment.commissioning_deadline ?? "—"}
                </td>
                <td className="p-2 font-mono text-xs">
                  <DaysCell days={p.days_to_deadline} />
                </td>
                <td className="p-2 font-mono text-xs">{p.mw_gap} MW</td>
                <td className="p-2 w-24">
                  <div className="font-mono text-[10px]">{p.risk_score}</div>
                  <RiskBar score={p.risk_score} />
                </td>
                <td className="p-2">
                  <FlagList flags={p.flags} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

function PipelineCard({ item: p }: { item: PipelineItem }) {
  return (
    <div className="ops-panel p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <StatusBadge status={p.deployment.status} />
            <Link href={`/?deploy=${p.deployment.id}`} className="font-mono text-sm text-ops-amber">
              {p.deployment.id}
            </Link>
          </div>
          <p className="mt-1 text-xs text-ops-muted">{p.customer}</p>
        </div>
        <span className="font-mono text-xs text-ops-critical">{p.risk_score}</span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 font-mono text-[10px]">
        <div>
          <span className="text-ops-muted">Deadline </span>
          {p.deployment.commissioning_deadline ?? "—"}
        </div>
        <div>
          <span className="text-ops-muted">Days </span>
          <DaysCell days={p.days_to_deadline} />
        </div>
        <div>
          <span className="text-ops-muted">Gap </span>
          {p.mw_gap} MW
        </div>
      </div>
      <div className="mt-2">
        <FlagList flags={p.flags} />
      </div>
    </div>
  );
}

function DaysCell({ days }: { days: number | null }) {
  if (days === null) return <>—</>;
  if (days < 0) return <span className="text-ops-critical">{Math.abs(days)}d overdue</span>;
  if (days <= 14) return <span className="text-ops-critical">{days}d</span>;
  return <>{days}d</>;
}

function FlagList({ flags }: { flags: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {flags.map((f) => (
        <span
          key={f}
          className="rounded-ops border border-ops-line px-1.5 py-px text-[10px] text-ops-muted"
        >
          {f}
        </span>
      ))}
    </div>
  );
}
