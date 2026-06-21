export type TriageState =
  | "unacked"
  | "acknowledged"
  | "investigating"
  | "escalated"
  | "cleared";

export type TriageRecord = {
  state: TriageState;
  updatedAt: string;
  note?: string;
};

export type TriageStateMap = Record<string, TriageRecord>;

export const TRIAGE_STORAGE_KEY = "goc-triage-state";

export const TRIAGE_OPTIONS: { id: TriageState; label: string; short: string }[] = [
  { id: "unacked", label: "Unacked", short: "NEW" },
  { id: "acknowledged", label: "Acknowledged", short: "ACK" },
  { id: "investigating", label: "Investigating", short: "INV" },
  { id: "escalated", label: "Escalated", short: "ESC" },
  { id: "cleared", label: "Cleared", short: "CLR" },
];

const ACTIVE_TRIAGE: TriageState[] = ["acknowledged", "investigating", "escalated"];

export function getTriageState(map: TriageStateMap, deploymentId: string): TriageState {
  return map[deploymentId]?.state ?? "unacked";
}

export function getTriageRecord(
  map: TriageStateMap,
  deploymentId: string
): TriageRecord | null {
  return map[deploymentId] ?? null;
}

export function isMyTriage(map: TriageStateMap, deploymentId: string): boolean {
  return ACTIVE_TRIAGE.includes(getTriageState(map, deploymentId));
}

export function loadTriageState(): TriageStateMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(TRIAGE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as TriageStateMap;
  } catch {
    return {};
  }
}

export function saveTriageState(map: TriageStateMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TRIAGE_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // quota or private mode — ignore
  }
}

export function setTriageRecord(
  map: TriageStateMap,
  deploymentId: string,
  update: { state: TriageState; note?: string }
): TriageStateMap {
  const prev = map[deploymentId];
  const next: TriageRecord = {
    state: update.state,
    updatedAt: new Date().toISOString(),
    note: update.note !== undefined ? update.note : prev?.note,
  };
  if (update.state === "unacked" && !next.note) {
    const { [deploymentId]: _, ...rest } = map;
    return rest;
  }
  return { ...map, [deploymentId]: next };
}

export function sortQueueByTriage<T extends { id: string }>(
  list: T[],
  map: TriageStateMap,
  showCleared: boolean
): T[] {
  const filtered = showCleared
    ? list
    : list.filter((d) => getTriageState(map, d.id) !== "cleared");

  return [...filtered].sort((a, b) => {
    const aCleared = getTriageState(map, a.id) === "cleared";
    const bCleared = getTriageState(map, b.id) === "cleared";
    if (aCleared === bCleared) return 0;
    return aCleared ? 1 : -1;
  });
}

export function filterByTriage<T extends { id: string }>(
  list: T[],
  map: TriageStateMap,
  mode: "all" | "my-triage"
): T[] {
  if (mode !== "my-triage") return list;
  return list.filter((d) => isMyTriage(map, d.id));
}
