export type UrgencyLevel = "overdue" | "critical" | "warning" | "ok" | "none";

/** Classify days_to_deadline into SLA urgency bands. */
export function urgencyLevel(days: number | null): UrgencyLevel {
  if (days === null) return "none";
  if (days < 0) return "overdue";
  if (days <= 7) return "critical";
  if (days <= 14) return "warning";
  return "ok";
}

export function urgencyClassName(level: UrgencyLevel): string {
  switch (level) {
    case "overdue":
    case "critical":
      return "text-ops-critical";
    case "warning":
      return "text-ops-amber";
    case "ok":
      return "text-ops-pass";
    default:
      return "text-ops-muted";
  }
}

export function formatDaysToDeadline(days: number | null): string {
  if (days === null) return "—";
  if (days < 0) return `${Math.abs(days)}d overdue`;
  return `${days}d`;
}

export function isOverdue(days: number | null): boolean {
  return days !== null && days < 0;
}

export function isDueWithin14(days: number | null): boolean {
  return days !== null && days >= 0 && days <= 14;
}
