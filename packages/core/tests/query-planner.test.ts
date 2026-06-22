import { describe, expect, it } from "vitest";
import { loadFixtureBundle } from "@cartographer/data";
import { OpsContext, executePlannedQuery, planQuery } from "../src/index.js";

describe("query planner", () => {
  const bundle = loadFixtureBundle();
  const ctx = new OpsContext(bundle);
  const codes = Object.keys(bundle.runbooks);

  it("matches site name without deployment ID", () => {
    const plan = planQuery("what's wrong with the lea county site?", bundle.deployments, codes);
    expect(plan.deploymentIds).toContain("BRG-2047");
    expect(plan.intent).toBe("deployment_status");
  });

  it("routes fleet MW gap questions", () => {
    const plan = planQuery("how much MW gap do we have right now?", bundle.deployments, codes);
    expect(plan.intent).toBe("fleet_summary");
    const { brief, tools } = executePlannedQuery(ctx, plan, "");
    expect(tools.some((t) => t.tool === "get_fleet_summary")).toBe(true);
    expect(brief.summary).toMatch(/MW gap/i);
  });

  it("uses selected deployment for contextual runbook", () => {
    const plan = planQuery("what's the runbook?", bundle.deployments, codes, {
      selectedDeploymentId: "BRG-2047",
    });
    expect(plan.intent).toBe("runbook_lookup");
    expect(plan.deploymentIds).toContain("BRG-2047");
  });

  it("compares two deployments", () => {
    const plan = planQuery("compare BRG-2047 vs BRG-1102", bundle.deployments, codes);
    expect(plan.intent).toBe("compare_deployments");
    const { brief } = executePlannedQuery(ctx, plan, "");
    expect(brief.citations.some((c) => c.deployment_id === "BRG-2047")).toBe(true);
    expect(brief.citations.some((c) => c.deployment_id === "BRG-1102")).toBe(true);
  });

  it("routes pipeline deadline questions", () => {
    const plan = planQuery("any commissioning deadlines due soon?", bundle.deployments, codes);
    expect(plan.intent).toBe("pipeline_deadlines");
  });
});
