import type { Brief } from "@cartographer/schemas";

export function validateBrief(brief: Brief, knownIds: Set<string>): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!brief.summary?.trim()) errors.push("Brief summary is empty.");
  if (!brief.citations?.length) errors.push("Brief must include at least one citation.");

  for (const c of brief.citations ?? []) {
    if (c.deployment_id && !knownIds.has(c.deployment_id)) {
      errors.push(`Unknown deployment_id in citation: ${c.deployment_id}`);
    }
    if (!c.source?.trim()) errors.push("Citation missing source field.");
  }

  const summaryUpper = brief.summary.toUpperCase();
  for (const id of knownIds) {
    if (summaryUpper.includes(id) && !brief.citations.some((c) => c.deployment_id === id)) {
      errors.push(`Summary references ${id} without citation.`);
    }
  }

  const mwPattern = /\b\d+(\.\d+)?\s*MW\b/gi;
  const mwInSummary = brief.summary.match(mwPattern) ?? [];
  if (mwInSummary.length) {
    const hasDataCitation = brief.citations.some(
      (c) =>
        c.source.startsWith("deployments.json") ||
        c.source.startsWith("fleet.") ||
        c.source.startsWith("pipeline.") ||
        c.source.startsWith("scenario.")
    );
    if (!hasDataCitation) errors.push("MW figures in summary must be traceable to cited data sources.");
  }

  return { ok: errors.length === 0, errors };
}
