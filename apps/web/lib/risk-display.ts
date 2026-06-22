/** Text color for numeric risk scores — red only at the top of the scale. */
export function riskClassName(score: number): string {
  if (score >= 70) return "text-ops-critical";
  if (score >= 50) return "text-ops-amber";
  return "text-ops-muted-bright";
}
