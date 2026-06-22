import type {
  Brief,
  BriefResponse,
  Citation,
  Contract,
  Deployment,
  FleetSummary,
  MorningDigest,
  PipelineItem,
  RiskRankedDeployment,
  Runbook,
  ScenarioResult,
  MwBucket,
} from "@cartographer/schemas";
import { executePlannedQuery, planQuery, type QueryContext } from "./query-planner.js";
import { TOOL_SCHEMAS } from "./tool-schemas.js";
import { validateBrief } from "./validate-brief.js";

export type FixtureBundle = {
  deployments: Deployment[];
  contracts: Contract[];
  runbooks: Record<string, Runbook>;
};

export class OpsContext {
  private readonly knownIds: Set<string>;

  constructor(private readonly data: FixtureBundle) {
    this.knownIds = new Set(data.deployments.map((d) => d.id));
  }

  get toolSchemas() {
    return TOOL_SCHEMAS;
  }

  listDeployments(): Deployment[] {
    return this.data.deployments;
  }

  getDeployment(id: string): Deployment | null {
    return this.data.deployments.find((d) => d.id === id) ?? null;
  }

  listExceptions(): Deployment[] {
    return this.data.deployments.filter((d) => d.status === "exception" || d.status === "watch");
  }

  getContractTerms(customerId: string): Contract | null {
    return this.data.contracts.find((c) => c.customer_id === customerId) ?? null;
  }

  getRunbookSnippet(code: string): Runbook | null {
    return this.data.runbooks[code] ?? null;
  }

  daysUntil(dateStr: string | null, from = new Date()): number | null {
    if (!dateStr) return null;
    const target = new Date(`${dateStr}T00:00:00`);
    return Math.ceil((target.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
  }

  slaFor(customerId: string): number {
    return this.getContractTerms(customerId)?.uptime_sla_pct ?? 99.0;
  }

  riskScore(d: Deployment, from = new Date()): number {
    const gap = d.mw_contracted - d.mw_available;
    const gapRatio = d.mw_contracted > 0 ? gap / d.mw_contracted : 0;
    const slaWeight = (100 - this.slaFor(d.customer_id)) * 2;
    const days = this.daysUntil(d.commissioning_deadline, from);
    let deadlineUrgency = 0;
    if (days !== null) {
      if (days < 0) deadlineUrgency = 30;
      else if (days <= 14) deadlineUrgency = 25;
      else if (days <= 30) deadlineUrgency = 15;
      else if (days <= 60) deadlineUrgency = 8;
    }
    const zeroMw = d.mw_available === 0 && d.status !== "healthy" ? 15 : 0;
    const statusBoost = d.status === "exception" ? 10 : d.status === "watch" ? 5 : 0;
    const raw = gapRatio * 40 + slaWeight + deadlineUrgency + zeroMw + statusBoost;
    return Math.min(100, Math.round(raw * 10) / 10);
  }

  rankDeployments(): RiskRankedDeployment[] {
    return this.data.deployments
      .filter((d) => d.status !== "healthy")
      .map((d) => ({
        ...d,
        risk_score: this.riskScore(d),
        mw_gap: d.mw_contracted - d.mw_available,
        days_to_deadline: this.daysUntil(d.commissioning_deadline),
        sla_pct: this.slaFor(d.customer_id),
      }))
      .sort((a, b) => b.risk_score - a.risk_score);
  }

  getFleetSummary(): FleetSummary {
    const by_type = {
      bridge: { contracted_mw: 0, available_mw: 0, gap_mw: 0, count: 0 },
      permanent: { contracted_mw: 0, available_mw: 0, gap_mw: 0, count: 0 },
    };
    const by_tranche: Record<string, MwBucket & { stressed_count: number }> = {};
    const by_basin: Record<string, MwBucket> = {};
    let total_contracted_mw = 0;
    let total_available_mw = 0;

    for (const d of this.data.deployments) {
      total_contracted_mw += d.mw_contracted;
      total_available_mw += d.mw_available;
      this.bucketAdd(by_type[d.type], d);
      if (!by_tranche[d.gfa_tranche]) {
        by_tranche[d.gfa_tranche] = { contracted_mw: 0, available_mw: 0, gap_mw: 0, count: 0, stressed_count: 0 };
      }
      const trancheBucket = by_tranche[d.gfa_tranche]!;
      this.bucketAdd(trancheBucket, d);
      if (d.status !== "healthy") trancheBucket.stressed_count += 1;
      const basin = this.basinFromSite(d.site);
      if (!by_basin[basin]) by_basin[basin] = { contracted_mw: 0, available_mw: 0, gap_mw: 0, count: 0 };
      this.bucketAdd(by_basin[basin], d);
    }

    return {
      total_contracted_mw,
      total_available_mw,
      total_gap_mw: total_contracted_mw - total_available_mw,
      deployment_count: this.data.deployments.length,
      by_type,
      by_tranche,
      by_basin,
    };
  }

  getPipeline(): PipelineItem[] {
    return this.data.deployments
      .map((d) => {
        const contract = this.getContractTerms(d.customer_id);
        const days = this.daysUntil(d.commissioning_deadline);
        const mw_gap = d.mw_contracted - d.mw_available;
        const flags: string[] = [];
        if (d.type === "bridge" && contract?.bridge_to_permanent) flags.push("bridge→permanent");
        if (d.mw_available === 0) flags.push("zero MW");
        if (d.exception_code === "GRID_INTERCONNECTION_DELAY") flags.push("interconnection hold");
        if (days !== null && days <= 14) flags.push("deadline ≤14d");
        if (d.status === "exception") flags.push("active exception");
        return {
          deployment: d,
          customer: contract?.customer ?? d.customer_id,
          bridge_to_permanent: contract?.bridge_to_permanent ?? false,
          days_to_deadline: days,
          mw_gap,
          risk_score: this.riskScore(d),
          flags,
        };
      })
      .filter((p) => p.deployment.type === "bridge" || p.bridge_to_permanent || p.deployment.commissioning_deadline)
      .sort((a, b) => {
        if (a.days_to_deadline === null && b.days_to_deadline === null) return b.risk_score - a.risk_score;
        if (a.days_to_deadline === null) return 1;
        if (b.days_to_deadline === null) return -1;
        return a.days_to_deadline - b.days_to_deadline;
      });
  }

  upcomingDeadlines(withinDays = 14): PipelineItem[] {
    return this.getPipeline().filter(
      (p) => p.days_to_deadline !== null && p.days_to_deadline <= withinDays
    );
  }

  runInterconnectionSlip(deploymentId: string, slipWeeks: number): ScenarioResult | null {
    const dep = this.getDeployment(deploymentId);
    if (!dep) return null;
    const original = dep.commissioning_deadline;
    const adjusted = original ? this.addWeeks(original, slipWeeks) : null;
    const contract = this.getContractTerms(dep.customer_id);
    const sla = contract?.uptime_sla_pct ?? 99;
    const sla_at_risk = slipWeeks >= 4 && dep.mw_available < dep.mw_contracted && sla >= 99.5;
    const summary = original
      ? `${deploymentId} interconnection slip of ${slipWeeks} weeks moves deadline from ${original} to ${adjusted}. ${dep.mw_contracted - dep.mw_available} MW gap on partial bridge; ${contract?.customer ?? dep.customer_id} SLA ${sla}% ${sla_at_risk ? "AT RISK" : "within tolerance"}.`
      : `${deploymentId} has no commissioning deadline on file; slip scenario applies to energization planning only.`;
    return {
      deployment_id: deploymentId,
      slip_weeks: slipWeeks,
      original_deadline: original,
      adjusted_deadline: adjusted,
      sla_at_risk,
      summary,
      affected_mw: dep.mw_contracted - dep.mw_available,
    };
  }

  buildMorningDigest(): MorningDigest {
    const generated_at = new Date().toISOString();
    const fleet = this.getFleetSummary();
    const top_risks = this.rankDeployments().slice(0, 3);
    const upcoming_deadlines = this.upcomingDeadlines(14);
    const citations = [
      { source: "fleet.summary" },
      ...top_risks.map((d) => ({ deployment_id: d.id, source: `deployments.json#${d.id}` })),
      ...upcoming_deadlines.map((p) => ({
        deployment_id: p.deployment.id,
        source: `pipeline.deadline#${p.deployment.id}`,
      })),
    ];
    const riskLines = top_risks.map(
      (d, i) =>
        `#${i + 1} ${d.id} (risk ${d.risk_score}): ${d.exception_summary ?? d.name} — ${d.mw_gap} MW gap` +
        (d.days_to_deadline !== null ? `, ${d.days_to_deadline}d to deadline` : "")
    );
    const deadlineLines = upcoming_deadlines.map(
      (p) =>
        `${p.deployment.id} (${p.customer}): deadline in ${p.days_to_deadline}d, ${p.mw_gap} MW gap` +
        (p.flags.length ? ` [${p.flags.join(", ")}]` : "")
    );
    const actions: string[] = [];
    if (top_risks[0]?.exception_code) {
      const rb = this.getRunbookSnippet(top_risks[0].exception_code);
      if (rb?.steps[0]) actions.push(`Top risk: ${rb.steps[0]}`);
    }
    actions.push(`Fleet: ${fleet.total_gap_mw} MW gap across ${fleet.deployment_count} deployments.`);
    if (upcoming_deadlines.length) {
      actions.push(`Monitor ${upcoming_deadlines.length} commissioning deadlines in next 14 days.`);
    }
    for (const r of top_risks) {
      const c = this.getContractTerms(r.customer_id);
      if (c?.bridge_to_permanent) actions.push(`Confirm bridge terms for ${r.id} (${c.customer}).`);
    }
    const maxSeverity: Brief["severity"] =
      top_risks.some((d) => d.risk_score >= 70) ? "critical" : top_risks.some((d) => d.risk_score >= 50) ? "high" : "medium";
    const brief: Brief = {
      summary: [
        `Morning ops digest — ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}.`,
        `Fleet: ${fleet.total_contracted_mw} MW contracted, ${fleet.total_available_mw} MW available, ${fleet.total_gap_mw} MW gap.`,
        `Bridge: ${fleet.by_type.bridge.gap_mw} MW gap (${fleet.by_type.bridge.count} sites); Permanent: ${fleet.by_type.permanent.gap_mw} MW gap.`,
        riskLines.length ? `Top risks: ${riskLines.join(" | ")}` : "No active risks.",
        deadlineLines.length ? `Deadlines (14d): ${deadlineLines.join(" | ")}` : "No commissioning deadlines in next 14 days.",
      ].join(" "),
      severity: maxSeverity,
      recommended_actions: actions.slice(0, 6),
      citations,
    };
    return { generated_at, fleet, top_risks, upcoming_deadlines, brief };
  }

  generateBrief(query: string, context?: QueryContext): BriefResponse {
    const generatedAt = new Date().toISOString();
    const knownCodes = Object.keys(this.data.runbooks);
    const plan = planQuery(query, this.data.deployments, knownCodes, context);
    const { brief, tools } = executePlannedQuery(this, plan, query);
    const validation = validateBrief(brief, this.knownIds);
    return {
      brief,
      validation,
      tools,
      generated_at: generatedAt,
      meta: {
        mode: "planner",
        intent: plan.intent,
        confidence: plan.confidence,
      },
    };
  }

  callTool(name: string, args: Record<string, unknown>): unknown {
    switch (name) {
      case "get_deployment":
        return this.getDeployment(String(args.deployment_id ?? ""));
      case "list_exceptions":
        return this.listExceptions();
      case "get_contract_terms":
        return this.getContractTerms(String(args.customer_id ?? ""));
      case "get_runbook_snippet":
        return this.getRunbookSnippet(String(args.exception_code ?? ""));
      case "get_fleet_summary":
        return this.getFleetSummary();
      case "get_pipeline":
        return this.getPipeline();
      case "run_scenario": {
        const weeks = Number(args.slip_weeks ?? 4);
        return this.runInterconnectionSlip(String(args.deployment_id ?? ""), Number.isFinite(weeks) ? weeks : 4);
      }
      default:
        return { error: `unknown tool: ${name}` };
    }
  }

  buildBriefForDeployment(deployment: Deployment): Brief {
    const severity = this.severityFor(deployment);
    const gap = deployment.mw_contracted - deployment.mw_available;
    const citations: Citation[] = [
      { deployment_id: deployment.id, customer_id: deployment.customer_id, exception_code: deployment.exception_code, source: `deployments.json#${deployment.id}` },
    ];
    const actions: string[] = [];
    if (deployment.exception_code) {
      actions.push(`Execute runbook for ${deployment.exception_code}.`);
      citations.push({ exception_code: deployment.exception_code, source: `runbooks.json#${deployment.exception_code}` });
    }
    actions.push(`Confirm SLA terms for ${deployment.customer_id}.`);
    citations.push({ customer_id: deployment.customer_id, source: `contracts.json#${deployment.customer_id}` });
    if (deployment.commissioning_deadline) {
      actions.push(`Track commissioning deadline ${deployment.commissioning_deadline}.`);
    }
    return {
      summary: [
        `${deployment.id} (${deployment.name}) is ${deployment.status}.`,
        deployment.exception_summary ?? "No active exception narrative on file.",
        `Contracted ${deployment.mw_contracted} MW; available ${deployment.mw_available} MW (${gap} MW gap).`,
        `Equipment: ${deployment.equipment}; GFA tranche ${deployment.gfa_tranche}.`,
      ].join(" "),
      severity,
      recommended_actions: actions,
      citations,
    };
  }

  buildExceptionQueueBrief(): Brief {
    const items = this.listExceptions();
    const citations = items.map((d) => ({ deployment_id: d.id, exception_code: d.exception_code, source: `deployments.json#${d.id}` }));
    const lines = items.map((d) => `${d.id}: ${d.exception_code ?? "WATCH"} — ${d.exception_summary ?? d.name}`);
    const maxSeverity: Brief["severity"] = items.some((d) => this.severityFor(d) === "critical") ? "critical" : items.some((d) => this.severityFor(d) === "high") ? "high" : "medium";
    return {
      summary: `${items.length} deployments need attention. ${lines.join(" | ")}`,
      severity: maxSeverity,
      recommended_actions: ["Triage critical items with zero available MW first.", "Pull contract terms for each affected customer.", "Assign runbook owner per exception code."],
      citations,
    };
  }

  buildScenarioBrief(deploymentId: string, slipWeeks: number): Brief | null {
    const result = this.runInterconnectionSlip(deploymentId, slipWeeks);
    if (!result) return null;
    const dep = this.getDeployment(deploymentId)!;
    return {
      summary: result.summary,
      severity: result.sla_at_risk ? "critical" : slipWeeks >= 4 ? "high" : "medium",
      recommended_actions: ["Notify customer ops within SLA window.", "Update GFA monthly demand forecast.", "Review bridge-to-permanent exhibit for extension clauses."],
      citations: [
        { deployment_id: deploymentId, source: `deployments.json#${deploymentId}` },
        { customer_id: dep.customer_id, source: `contracts.json#${dep.customer_id}` },
        { source: `scenario.slip#${slipWeeks}w` },
      ],
    };
  }

  buildTrancheBrief(tranche: string): Brief | null {
    const bucket = this.getFleetSummary().by_tranche[tranche];
    if (!bucket) return null;
    return {
      summary: `GFA tranche ${tranche}: ${bucket.contracted_mw} MW contracted, ${bucket.available_mw} MW available, ${bucket.gap_mw} MW gap across ${bucket.count} deployments. ${bucket.stressed_count} stressed.`,
      severity: bucket.stressed_count >= 2 ? "high" : bucket.stressed_count === 1 ? "medium" : "low",
      recommended_actions: [`Review stressed deployments in ${tranche} for CAT GFA demand signal.`, "Confirm bridge capacity covers gap until permanent energization."],
      citations: [{ source: `fleet.tranche#${tranche}` }],
    };
  }

  buildPipelineDeadlinesBrief(withinDays = 14): Brief {
    const upcoming = this.upcomingDeadlines(withinDays);
    const citations = upcoming.map((p) => ({
      deployment_id: p.deployment.id,
      source: `pipeline.deadline#${p.deployment.id}`,
    }));
    if (!citations.length) {
      return {
        summary: `No commissioning deadlines in the next ${withinDays} days.`,
        severity: "low",
        recommended_actions: ["Check /pipeline for full bridge-to-permanent schedule."],
        citations: [{ source: "pipeline.deadlines" }],
      };
    }
    const lines = upcoming.map(
      (p) =>
        `${p.deployment.id} (${p.customer}): ${p.days_to_deadline}d, ${p.mw_gap} MW gap` +
        (p.flags.length ? ` [${p.flags.join(", ")}]` : "")
    );
    const overdue = upcoming.filter((p) => (p.days_to_deadline ?? 0) < 0);
    return {
      summary: `${upcoming.length} commissioning deadlines in next ${withinDays}d: ${lines.join(" | ")}.`,
      severity: overdue.length ? "critical" : upcoming.some((p) => (p.days_to_deadline ?? 99) <= 7) ? "high" : "medium",
      recommended_actions: [
        "Confirm runbook owners for sites inside 7d window.",
        "Escalate overdue commissioning to customer ops.",
      ],
      citations: citations.length ? citations : [{ source: "pipeline.deadlines" }],
    };
  }

  buildRunbookBrief(exceptionCode: string, deploymentId?: string | null): Brief {
    const rb = this.getRunbookSnippet(exceptionCode);
    const citations: Citation[] = [{ exception_code: exceptionCode, source: `runbooks.json#${exceptionCode}` }];
    if (deploymentId) citations.unshift({ deployment_id: deploymentId, source: `deployments.json#${deploymentId}` });
    if (!rb) {
      return {
        summary: `No runbook on file for ${exceptionCode}.`,
        severity: "medium",
        recommended_actions: ["Escalate to engineering for ad-hoc procedure.", "Log exception in shift notes."],
        citations,
      };
    }
    return {
      summary: `${rb.title} (${exceptionCode}): ${rb.steps.join(" → ")}`,
      severity: "medium",
      recommended_actions: rb.steps.slice(0, 4),
      citations,
    };
  }

  buildCompareBrief(idA: string, idB: string): Brief {
    const a = this.getDeployment(idA);
    const b = this.getDeployment(idB);
    if (!a || !b) {
      return {
        summary: `Cannot compare — missing deployment ${!a ? idA : idB}.`,
        severity: "low",
        recommended_actions: ["Verify both IDs exist in the queue."],
        citations: [{ source: "system.compare" }],
      };
    }
    const gapA = a.mw_contracted - a.mw_available;
    const gapB = b.mw_contracted - b.mw_available;
    const riskA = this.riskScore(a);
    const riskB = this.riskScore(b);
    return {
      summary: [
        `${idA}: ${a.status}, risk ${riskA}, ${gapA} MW gap, SLA ${this.slaFor(a.customer_id)}%.`,
        `${idB}: ${b.status}, risk ${riskB}, ${gapB} MW gap, SLA ${this.slaFor(b.customer_id)}%.`,
        riskA > riskB ? `${idA} ranks higher risk.` : riskB > riskA ? `${idB} ranks higher risk.` : "Both rank similarly.",
      ].join(" "),
      severity: Math.max(riskA, riskB) >= 70 ? "critical" : Math.max(riskA, riskB) >= 50 ? "high" : "medium",
      recommended_actions: [
        `Triage ${riskA >= riskB ? idA : idB} first.`,
        "Pull contract terms for both customers.",
      ],
      citations: [
        { deployment_id: idA, source: `deployments.json#${idA}` },
        { deployment_id: idB, source: `deployments.json#${idB}` },
      ],
    };
  }

  whoBreachesSlaOnSlip(slipWeeks: number): Brief {
    const atRisk = this.data.deployments.filter((d) => {
      if (d.status === "healthy") return false;
      return this.runInterconnectionSlip(d.id, slipWeeks)?.sla_at_risk;
    });
    const citations = atRisk.length
      ? atRisk.map((d) => ({ deployment_id: d.id, source: `deployments.json#${d.id}` }))
      : [{ source: "scenario.fleet_sla_scan" }];
    return {
      summary:
        atRisk.length === 0
          ? `No deployments flagged for SLA breach at ${slipWeeks}-week interconnection slip across the fleet.`
          : `SLA at risk if interconnection slips ${slipWeeks} weeks: ${atRisk.map((d) => `${d.id} (${this.slaFor(d.customer_id)}% SLA, ${d.mw_contracted - d.mw_available} MW gap)`).join("; ")}.`,
      severity: atRisk.length >= 2 ? "critical" : atRisk.length === 1 ? "high" : "low",
      recommended_actions: ["Prioritize bridge capacity for highest-SLA customers.", "Escalate utility queue contacts for flagged sites."],
      citations,
    };
  }

  private severityFor(deployment: Deployment): Brief["severity"] {
    if (deployment.status === "exception" && deployment.mw_available === 0) return "critical";
    if (deployment.status === "exception") return "high";
    if (deployment.status === "watch") return "medium";
    return "low";
  }

  private bucketAdd(bucket: MwBucket, d: Deployment) {
    bucket.contracted_mw += d.mw_contracted;
    bucket.available_mw += d.mw_available;
    bucket.gap_mw += d.mw_contracted - d.mw_available;
    bucket.count += 1;
  }

  private basinFromSite(site: string): string {
    if (site.includes("NM") || site.toLowerCase().includes("lea")) return "Delaware Basin";
    if (site.includes("Midland") || site.includes("Reeves") || site.includes("Ector") || site.includes("Kermit")) return "Permian Basin";
    return "Other";
  }

  private addWeeks(dateStr: string, weeks: number): string {
    const d = new Date(`${dateStr}T00:00:00`);
    d.setDate(d.getDate() + weeks * 7);
    return d.toISOString().slice(0, 10);
  }
}
