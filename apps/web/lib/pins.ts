export const PINS_STORAGE_KEY = "goc-pins";

export function loadPins(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PINS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

export function savePins(pins: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PINS_STORAGE_KEY, JSON.stringify(pins));
  } catch {
    // quota or private mode — ignore
  }
}

export function isPinned(pins: string[], deploymentId: string): boolean {
  return pins.includes(deploymentId);
}

export function pin(pins: string[], deploymentId: string): string[] {
  if (pins.includes(deploymentId)) return pins;
  return [...pins, deploymentId];
}

export function unpin(pins: string[], deploymentId: string): string[] {
  return pins.filter((id) => id !== deploymentId);
}

export function togglePin(pins: string[], deploymentId: string): string[] {
  return isPinned(pins, deploymentId) ? unpin(pins, deploymentId) : pin(pins, deploymentId);
}

/** Stable sort: pinned deployments first, relative order preserved within each group. */
export function sortWithPinsFirst<T extends { id: string }>(list: T[], pins: string[]): T[] {
  if (pins.length === 0) return list;
  const pinSet = new Set(pins);
  const pinned: T[] = [];
  const rest: T[] = [];
  for (const item of list) {
    if (pinSet.has(item.id)) pinned.push(item);
    else rest.push(item);
  }
  const pinOrder = new Map(pins.map((id, i) => [id, i]));
  pinned.sort((a, b) => (pinOrder.get(a.id) ?? 0) - (pinOrder.get(b.id) ?? 0));
  return [...pinned, ...rest];
}
