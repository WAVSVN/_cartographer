export const RUNBOOK_CHECKS_STORAGE_KEY = "goc-runbook-checks";

export type RunbookChecksMap = Record<string, boolean[]>;

export function loadRunbookChecks(): RunbookChecksMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(RUNBOOK_CHECKS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as RunbookChecksMap;
  } catch {
    return {};
  }
}

export function saveRunbookChecks(map: RunbookChecksMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RUNBOOK_CHECKS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // quota or private mode — ignore
  }
}

function ensureStepArray(existing: boolean[] | undefined, stepCount: number): boolean[] {
  const next = existing ? [...existing] : [];
  while (next.length < stepCount) next.push(false);
  if (next.length > stepCount) next.length = stepCount;
  return next;
}

export function isStepChecked(
  map: RunbookChecksMap,
  deploymentId: string,
  stepIndex: number
): boolean {
  return map[deploymentId]?.[stepIndex] ?? false;
}

export function toggleStep(
  map: RunbookChecksMap,
  deploymentId: string,
  stepIndex: number,
  stepCount: number
): RunbookChecksMap {
  const steps = ensureStepArray(map[deploymentId], stepCount);
  steps[stepIndex] = !steps[stepIndex];
  return { ...map, [deploymentId]: steps };
}
