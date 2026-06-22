export const AUDIT_LOG_STORAGE_KEY = "goc-audit-log";
export const AUDIT_LOG_MAX = 200;

export type AuditAction =
  | "triage_change"
  | "runbook_check"
  | "brief_run"
  | "scenario_run"
  | "pin_toggle"
  | "handoff_export"
  | "digest_run";

export type AuditEntry = {
  id: string;
  action: AuditAction;
  at: string;
  deployment_id?: string;
  detail: string;
  meta?: Record<string, string | number | boolean>;
};

export function loadAuditLog(): AuditEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(AUDIT_LOG_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is AuditEntry =>
        !!e &&
        typeof e === "object" &&
        typeof (e as AuditEntry).id === "string" &&
        typeof (e as AuditEntry).action === "string" &&
        typeof (e as AuditEntry).at === "string" &&
        typeof (e as AuditEntry).detail === "string"
    );
  } catch {
    return [];
  }
}

export function saveAuditLog(entries: AuditEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(AUDIT_LOG_STORAGE_KEY, JSON.stringify(entries.slice(0, AUDIT_LOG_MAX)));
  } catch {
    // quota or private mode
  }
}

export function appendAuditEntry(
  entries: AuditEntry[],
  input: Omit<AuditEntry, "id" | "at"> & { at?: string }
): AuditEntry[] {
  const entry: AuditEntry = {
    id: crypto.randomUUID(),
    at: input.at ?? new Date().toISOString(),
    action: input.action,
    detail: input.detail,
    deployment_id: input.deployment_id,
    meta: input.meta,
  };
  return [entry, ...entries].slice(0, AUDIT_LOG_MAX);
}

export function logAudit(input: Omit<AuditEntry, "id" | "at"> & { at?: string }): AuditEntry[] {
  const next = appendAuditEntry(loadAuditLog(), input);
  saveAuditLog(next);
  return next;
}

export function clearAuditLog(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(AUDIT_LOG_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function formatAuditAction(action: AuditAction): string {
  switch (action) {
    case "triage_change":
      return "triage";
    case "runbook_check":
      return "runbook";
    case "brief_run":
      return "brief";
    case "scenario_run":
      return "scenario";
    case "pin_toggle":
      return "pin";
    case "handoff_export":
      return "handoff";
    case "digest_run":
      return "digest";
    default:
      return action;
  }
}
