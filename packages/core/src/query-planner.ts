import type { Brief, Deployment, ToolLogEntry } from "@cartographer/schemas";
import type { OpsContext } from "./ops-context.js";

export type QueryIntent =
  | "morning_digest"
  | "deployment_status"
  | "scenario_slip"
  | "sla_breach_scan"
  | "fleet_summary"
  | "tranche_gap"
  | "exception_queue"
  | "pipeline_deadlines"
  | "runbook_lookup"
  | "compare_deployments"
  | "unknown";

export type QueryContext = {
  selectedDeploymentId?: string;
};

export type PlannedQuery = {
  intent: QueryIntent;
  confidence: number;
  deploymentIds: string[];
  slipWeeks: number | null;
  tranche: string | null;
  exceptionCode: string | null;
};

const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "our", "we", "my", "me", "for", "to", "of", "in",
  "on", "at", "and", "or", "if", "what", "how", "who", "when", "where", "why", "can", "you", "i",
  "do", "does", "did", "with", "that", "this", "any", "all", "be", "been", "have", "has", "had",
  "tell", "give", "show", "get", "please", "just", "now", "today",
]);

const SITE_HINTS: Record<string, string[]> = {
  "BRG-2047": ["lea", "delaware", "midstream", "commissioning"],
  "BRG-1102": ["midland", "permian", "data hall", "interconnection", "hold"],
  "PRM-3301": ["moser", "microgrid", "reeves", "hybrid", "lng"],
  "PRM-0890": ["kermit", "dune", "loadout", "last-mile"],
  "BRG-3019": ["desal", "ector", "phased", "ramp", "pilot"],
};

const INTENT_KEYWORDS: Record<QueryIntent, string[]> = {
  morning_digest: ["digest", "morning", "daily", "shift", "overview", "start"],
  deployment_status: ["status", "happened", "wrong", "red", "down", "issue", "broken", "failed", "site", "deployment"],
  scenario_slip: ["slip", "delay", "delayed", "push", "weeks", "week", "scenario", "what if", "what-if"],
  sla_breach_scan: ["breach", "breaches", "violates", "violate", "at risk"],
  fleet_summary: ["fleet", "total", "gap", "mw", "capacity", "contracted", "available", "much", "many"],
  tranche_gap: ["tranche", "gfa"],
  exception_queue: ["exception", "exceptions", "queue", "attention", "triage", "watch", "stressed", "open"],
  pipeline_deadlines: ["deadline", "deadlines", "due", "commissioning", "upcoming", "overdue", "soon"],
  runbook_lookup: ["runbook", "steps", "procedure", "playbook", "checklist"],
  compare_deployments: ["compare", "versus", "vs", "difference", "between"],
  unknown: [],
};

export function extractDeploymentIds(text: string): string[] {
  const matches = text.match(/\b(BRG|PRM)-\d{4}\b/gi) ?? [];
  return [...new Set(matches.map((m) => m.toUpperCase()))];
}

export function extractSlipWeeks(lower: string): number | null {
  const weeksMatch = lower.match(/(\d+)\s*(?:more\s+)?weeks?/);
  if (weeksMatch) return parseInt(weeksMatch[1] ?? "4", 10);
  if (lower.includes("slip") || lower.includes("delay")) return 4;
  return null;
}

export function extractTranche(text: string): string | null {
  const match = text.match(/\d{4}-(?:H[12]|Q[1-4])/i);
  return match ? match[0].toUpperCase().replace("h", "H").replace("q", "Q") : null;
}

export function extractExceptionCode(text: string, knownCodes: string[]): string | null {
  const upper = text.toUpperCase().replace(/\s+/g, "_");
  for (const code of knownCodes) {
    if (upper.includes(code)) return code;
  }
  return null;
}

function tokenize(lower: string): string[] {
  return lower
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

function matchDeploymentBySite(query: string, deployments: Deployment[]): string | null {
  const lower = query.toLowerCase();
  let best: { id: string; score: number } | null = null;

  for (const d of deployments) {
    let score = 0;
    const hints = SITE_HINTS[d.id] ?? [];
    for (const hint of hints) {
      if (lower.includes(hint)) score += hint.includes(" ") ? 3 : 2;
    }
    const nameTokens = d.name.toLowerCase().split(/[\s—,-]+/).filter((t) => t.length > 3);
    for (const token of nameTokens) {
      if (lower.includes(token)) score += 1;
    }
    if (d.site.toLowerCase().split(/,\s*/).some((part) => lower.includes(part.toLowerCase()))) {
      score += +2;
    }
    if (score > 0 && (!best || score > best.score)) best = { id: d.id, score };
  }
  return best && best.score >= 2 ? best.id : null;
}

function scoreIntent(intent: QueryIntent, tokens: string[], lower: string): number {
  const keywords = INTENT_KEYWORDS[intent];
  let score = 0;
  for (const kw of keywords) {
    if (kw.includes(" ")) {
      if (lower.includes(kw)) score += 3;
    } else if (tokens.includes(kw)) {
      score += 2;
    }
  }
  return score;
}

export function planQuery(
  query: string,
  deployments: Deployment[],
  knownExceptionCodes: string[],
  context?: QueryContext
): PlannedQuery {
  const trimmed = query.trim();
  const lower = trimmed.toLowerCase();
  const tokens = tokenize(lower);

  let deploymentIds = extractDeploymentIds(trimmed);
  const siteMatch = matchDeploymentBySite(trimmed, deployments);
  if (siteMatch && !deploymentIds.includes(siteMatch)) {
    deploymentIds = [siteMatch, ...deploymentIds];
  }
  if (deploymentIds.length === 0 && context?.selectedDeploymentId) {
    const contextual =
      lower.includes("this") ||
      lower.includes("here") ||
      lower.includes("selected") ||
      lower.includes("runbook") ||
      lower.includes("status") ||
      lower.includes("slip") ||
      tokens.length <= 4;
    if (contextual) deploymentIds = [context.selectedDeploymentId];
  }

  const slipWeeks = extractSlipWeeks(lower);
  const tranche = extractTranche(trimmed);
  const exceptionCode = extractExceptionCode(trimmed, knownExceptionCodes);

  const scores: Array<{ intent: QueryIntent; score: number }> = [];
  for (const intent of Object.keys(INTENT_KEYWORDS) as QueryIntent[]) {
    if (intent === "unknown") continue;
    scores.push({ intent, score: scoreIntent(intent, tokens, lower) });
  }

  if (lower.includes("sla") && (lower.includes("breach") || lower.includes("who"))) {
    const entry = scores.find((s) => s.intent === "sla_breach_scan");
    if (entry) entry.score += 5;
  }
  if (lower.includes("who") && lower.includes("breach")) {
    const entry = scores.find((s) => s.intent === "sla_breach_scan");
    if (entry) entry.score += 6;
  }
  if (slipWeeks !== null && deploymentIds.length > 0) {
    const entry = scores.find((s) => s.intent === "scenario_slip");
    if (entry) entry.score += 6;
  }
  if (deploymentIds.length >= 2) {
    const entry = scores.find((s) => s.intent === "compare_deployments");
    if (entry) entry.score += 6;
  }
  if (deploymentIds.length === 1 && !slipWeeks) {
    const entry = scores.find((s) => s.intent === "deployment_status");
    if (entry) entry.score += 3;
  }
  if (tranche) {
    const entry = scores.find((s) => s.intent === "tranche_gap");
    if (entry) entry.score += 6;
  }
  if (exceptionCode || (lower.includes("runbook") && deploymentIds.length === 1)) {
    const entry = scores.find((s) => s.intent === "runbook_lookup");
    if (entry) entry.score += 5;
  }
  if (lower.includes("digest") || lower.includes("morning")) {
    const entry = scores.find((s) => s.intent === "morning_digest");
    if (entry) entry.score += 5;
  }

  scores.sort((a, b) => b.score - a.score);
  const top = scores[0];
  const intent = top && top.score >= 2 ? top.intent : deploymentIds.length ? "deployment_status" : "unknown";
  const confidence = top ? Math.min(1, top.score / 8) : 0.2;

  return {
    intent,
    confidence,
    deploymentIds,
    slipWeeks,
    tranche,
    exceptionCode,
  };
}

function logTool(
  ops: OpsContext,
  tool: string,
  args: Record<string, unknown>,
  trace: ToolLogEntry[]
): unknown {
  const result = ops.callTool(tool, args);
  trace.push({ tool, args, result });
  return result;
}

export function executePlannedQuery(
  ops: OpsContext,
  plan: PlannedQuery,
  _query: string
): { brief: Brief; tools: ToolLogEntry[] } {
  const tools: ToolLogEntry[] = [];

  switch (plan.intent) {
    case "morning_digest": {
      logTool(ops, "get_fleet_summary", {}, tools);
      logTool(ops, "get_pipeline", {}, tools);
      logTool(ops, "list_exceptions", {}, tools);
      return { brief: ops.buildMorningDigest().brief, tools };
    }
    case "deployment_status": {
      const id = plan.deploymentIds[0];
      if (!id) return { brief: helpBrief(plan), tools };
      const dep = ops.getDeployment(id);
      logTool(ops, "get_deployment", { deployment_id: id }, tools);
      if (!dep) return { brief: unknownDeploymentBrief(id), tools };
      if (dep.exception_code) {
        logTool(ops, "get_runbook_snippet", { exception_code: dep.exception_code }, tools);
      }
      logTool(ops, "get_contract_terms", { customer_id: dep.customer_id }, tools);
      return { brief: ops.buildBriefForDeployment(dep), tools };
    }
    case "scenario_slip": {
      const id = plan.deploymentIds[0];
      const weeks = plan.slipWeeks ?? 4;
      if (!id) return { brief: helpBrief(plan), tools };
      logTool(ops, "run_scenario", { deployment_id: id, slip_weeks: weeks }, tools);
      const dep = ops.getDeployment(id);
      if (dep) logTool(ops, "get_contract_terms", { customer_id: dep.customer_id }, tools);
      const brief = ops.buildScenarioBrief(id, weeks);
      return { brief: brief ?? helpBrief(plan), tools };
    }
    case "sla_breach_scan": {
      const weeks = plan.slipWeeks ?? 4;
      logTool(ops, "get_fleet_summary", {}, tools);
      logTool(ops, "get_pipeline", {}, tools);
      return { brief: ops.whoBreachesSlaOnSlip(weeks), tools };
    }
    case "fleet_summary": {
      logTool(ops, "get_fleet_summary", {}, tools);
      const f = ops.getFleetSummary();
      return {
        brief: {
          summary: `Fleet: ${f.total_contracted_mw} MW contracted, ${f.total_available_mw} MW available, ${f.total_gap_mw} MW gap across ${f.deployment_count} sites. Bridge gap ${f.by_type.bridge.gap_mw} MW (${f.by_type.bridge.count}); permanent gap ${f.by_type.permanent.gap_mw} MW (${f.by_type.permanent.count}).`,
          severity: f.total_gap_mw > 15 ? "high" : f.total_gap_mw > 8 ? "medium" : "low",
          recommended_actions: [
            "Review tranche rollups on /fleet.",
            "Check pipeline deadlines on /pipeline.",
            "Triage deployments with zero available MW first.",
          ],
          citations: [{ source: "fleet.summary" }],
        },
        tools,
      };
    }
    case "tranche_gap": {
      const tranche = plan.tranche ?? "2026-H2";
      logTool(ops, "get_fleet_summary", {}, tools);
      const brief = ops.buildTrancheBrief(tranche);
      return { brief: brief ?? helpBrief(plan), tools };
    }
    case "exception_queue": {
      logTool(ops, "list_exceptions", {}, tools);
      return { brief: ops.buildExceptionQueueBrief(), tools };
    }
    case "pipeline_deadlines": {
      logTool(ops, "get_pipeline", {}, tools);
      return { brief: ops.buildPipelineDeadlinesBrief(14), tools };
    }
    case "runbook_lookup": {
      const id = plan.deploymentIds[0];
      let code = plan.exceptionCode;
      if (!code && id) {
        const dep = ops.getDeployment(id);
        logTool(ops, "get_deployment", { deployment_id: id }, tools);
        code = dep?.exception_code ?? null;
      }
      if (!code) return { brief: helpBrief(plan), tools };
      logTool(ops, "get_runbook_snippet", { exception_code: code }, tools);
      return { brief: ops.buildRunbookBrief(code, id), tools };
    }
    case "compare_deployments": {
      const [a, b] = plan.deploymentIds;
      if (!a || !b) return { brief: helpBrief(plan), tools };
      logTool(ops, "get_deployment", { deployment_id: a }, tools);
      logTool(ops, "get_deployment", { deployment_id: b }, tools);
      return { brief: ops.buildCompareBrief(a, b), tools };
    }
    default:
      return { brief: helpBrief(plan), tools };
  }
}

function unknownDeploymentBrief(id: string): Brief {
  return {
    summary: `No deployment found for ${id}. Use BRG-#### or PRM-#### from the queue.`,
    severity: "low",
    recommended_actions: ["Check the deployment ID in the queue filter.", "Try fleet summary or exception queue."],
    citations: [{ source: "system.unknown_deployment" }],
  };
}

function helpBrief(plan: PlannedQuery): Brief {
  const hints = [
    "Morning ops digest",
    "What's wrong with the Lea County site?",
    "If BRG-1102 slips 4 weeks who breaches SLA?",
    "How much MW gap in the fleet?",
    "What deadlines are due in the next 14 days?",
    "Runbook for BRG-2047",
    "Compare BRG-2047 and BRG-1102",
  ];
  return {
    summary: `I didn't match that to fleet data. Try natural questions like: ${hints.slice(0, 4).join("; ")}.`,
    severity: "low",
    recommended_actions: hints.slice(4),
    citations: [{ source: "system.query_hints" }],
  };
}
