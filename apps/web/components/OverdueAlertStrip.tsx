"use client";

import Link from "next/link";

type Props = {
  count: number;
  onOverdueClick?: () => void;
};

export default function OverdueAlertStrip({ count, onOverdueClick }: Props) {
  if (count === 0) return null;

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
