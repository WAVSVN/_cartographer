import type { RiskRankedDeployment } from "@/lib/types";

export type PaletteAction = {
  kind: "action";
  id: string;
  label: string;
  subtitle: string;
  digest: boolean;
  query: string;
};

export type PaletteDeployment = {
  kind: "deployment";
  id: string;
  label: string;
  subtitle: string;
  deployment: RiskRankedDeployment;
};

export type PaletteItem = PaletteAction | PaletteDeployment;

export function buildPaletteItems(
  deployments: RiskRankedDeployment[],
  actions: { step: number; label: string; query: string; digest?: boolean }[]
): PaletteItem[] {
  const deploymentItems: PaletteDeployment[] = deployments.map((d) => ({
    kind: "deployment",
    id: `dep-${d.id}`,
    label: d.id,
    subtitle: `${d.name} · ${d.site}`,
    deployment: d,
  }));

  const actionItems: PaletteAction[] = actions.map((a) => ({
    kind: "action",
    id: `action-${a.step}`,
    label: a.label,
    subtitle: a.digest ? "Shift action · digest" : "Shift action · scenario",
    digest: Boolean(a.digest),
    query: a.query,
  }));

  return [...deploymentItems, ...actionItems];
}

function scoreItem(item: PaletteItem, q: string): number {
  const needle = q.trim().toLowerCase();
  if (!needle) return 1;

  const haystacks =
    item.kind === "deployment"
      ? [item.label, item.deployment.name, item.deployment.site]
      : [item.label, item.subtitle];

  let best = 0;
  for (const h of haystacks) {
    const lower = h.toLowerCase();
    if (lower === needle) best = Math.max(best, 100);
    else if (lower.startsWith(needle)) best = Math.max(best, 80);
    else if (lower.includes(needle)) best = Math.max(best, 50);
  }
  return best;
}

export function searchPaletteItems(items: PaletteItem[], query: string): PaletteItem[] {
  const q = query.trim();
  if (!q) return items;

  return items
    .map((item) => ({ item, score: scoreItem(item, q) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label))
    .map(({ item }) => item);
}
