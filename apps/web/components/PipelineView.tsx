"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { PipelineItem } from "@/lib/types";
import { isDueWithin14, isOverdue } from "@/lib/sla-urgency";
import SlaCountdown from "./SlaCountdown";
import { PageHeader, SectionLabel, Skeleton, StatusBadge } from "./ui";

type PipelineFilter = "all" | "overdue" | "due-14";

const PIPELINE_FILTERS: { id: PipelineFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "overdue", label: "Overdue" },
  { id: "due-14", label: "Due ≤14d" },
];

function sortByDeadline(items: PipelineItem[]): PipelineItem[] {
  return [...items].sort((a, b) => {
    if (a.days_to_deadline === null && b.days_to_deadline === null) return 0;
    if (a.days_to_deadline === null) return 1;
    if (b.days_to_deadline === null) return -1;
    return a.days_to_deadline - b.days_to_deadline;
  });
}

export default function PipelineView() {
  const [items, setItems] = useState<PipelineItem[] | null>(null);
  const [pipeFilter, setPipeFilter] = useState<PipelineFilter>("all");

  useEffect(() => {
    fetch("/api/pipeline")
      .then((r) => r.json())
      .then((d) => setItems(d.pipeline ?? []));
  }, []);

  const displayed = useMemo(() => {
    if (!items) return [];
    let list = items;
    switch (pipeFilter) {
      case "overdue":
        list = list.filter((p) => isOverdue(p.days_to_deadline));
        break;
      case "due-14":
        list = list.filter((p) => isDueWithin14(p.days_to_deadline));
        break;
    }
    return sortByDeadline(list);
  }, [items, pipeFilter]);

  if (!items) {
    return (
      <div className="p-4">
        <Skeleton className="mb-4 h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4">
      <PageHeader
        title="Bridge → Permanent Pipeline"
        subtitle={`${displayed.length} of ${items.length} transitions tracked`}
      />

      <div className="flex flex-wrap gap-3 border-b border-ops-line" role="tablist" aria-label="Pipeline filters">
        {PIPELINE_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={pipeFilter === f.id}
            onClick={() => setPipeFilter(f.id)}
            className={`-mb-px border-b-2 pb-1.5 text-xs transition ${
              pipeFilter === f.id
                ? "border-ops-link text-ops-text"
                : "border-transparent text-ops-muted hover:text-ops-text"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-0 md:hidden">
        {displayed.map((p) => (
          <PipelineCard key={p.deployment.id} item={p} />
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm" role="table">
          <thead>
            <tr className="border-b border-ops-line text-xs font-medium text-ops-muted">
              <th scope="col" className="py-2 pr-3">
                ID
              </th>
              <th scope="col" className="py-2 pr-3">
                Customer
              </th>
              <th scope="col" className="py-2 pr-3">
                Type
              </th>
              <th scope="col" className="py-2 pr-3">
                Deadline
              </th>
              <th scope="col" className="py-2 pr-3">
                Days
              </th>
              <th scope="col" className="py-2 pr-3">
                Gap
              </th>
              <th scope="col" className="py-2 pr-3">
                Risk
              </th>
              <th scope="col" className="py-2">
                Flags
              </th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((p) => (
              <tr
                key={p.deployment.id}
                className="border-b border-ops-line/40 hover:bg-ops-elevated/50"
              >
                <td className="py-2 pr-3">
                  <Link
                    href={`/?deploy=${p.deployment.id}`}
                    className="font-mono text-xs text-ops-link hover:underline"
                  >
                    {p.deployment.id}
                  </Link>
                </td>
                <td className="py-2 pr-3 text-xs">{p.customer}</td>
                <td className="py-2 pr-3 text-xs capitalize">{p.deployment.type}</td>
                <td className="py-2 pr-3 font-mono text-[11px]">
                  {p.deployment.commissioning_deadline ?? "—"}
                </td>
                <td className="py-2 pr-3 text-xs">
                  <SlaCountdown days={p.days_to_deadline} />
                </td>
                <td className="py-2 pr-3 font-mono text-xs">{p.mw_gap} MW</td>
                <td className="py-2 pr-3 font-mono text-xs tabular-nums text-ops-critical">
                  {p.risk_score}
                </td>
                <td className="py-2">
                  <FlagList flags={p.flags} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PipelineCard({ item: p }: { item: PipelineItem }) {
  return (
    <div className="border-b border-ops-line py-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <StatusBadge status={p.deployment.status} />
            <Link href={`/?deploy=${p.deployment.id}`} className="font-mono text-sm text-ops-link">
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
          <SlaCountdown days={p.days_to_deadline} />
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
