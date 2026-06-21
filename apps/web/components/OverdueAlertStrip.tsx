"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { RiskRankedDeployment } from "@/lib/types";
import { isOverdue } from "@/lib/sla-urgency";

type Props = {
  onOverdueClick?: () => void;
};

export default function OverdueAlertStrip({ onOverdueClick }: Props) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/deployments")
      .then((r) => r.json())
      .then((data) => {
        const list: RiskRankedDeployment[] = data.risk_ranked ?? [];
        setCount(list.filter((d) => isOverdue(d.days_to_deadline)).length);
      })
      .catch(() => setCount(0));
  }, []);

  if (count === null || count === 0) return null;

  const label = `${count} deployment${count === 1 ? "" : "s"} past commissioning deadline`;

  const className =
    "block w-full border-b border-ops-critical/40 bg-ops-critical/10 px-4 py-2 text-left font-mono text-xs text-ops-critical transition hover:bg-ops-critical/15";

  if (onOverdueClick) {
    return (
      <button type="button" onClick={onOverdueClick} className={className}>
        {label} — View overdue
      </button>
    );
  }

  return (
    <Link href="/?filter=overdue" className={className}>
      {label} — View overdue
    </Link>
  );
}
