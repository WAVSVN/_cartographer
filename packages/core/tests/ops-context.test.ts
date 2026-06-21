import { describe, expect, it } from "vitest";
import { loadFixtureBundle } from "@cartographer/data";
import { OpsContext } from "../src/index.js";

describe("OpsContext", () => {
  const ctx = new OpsContext(loadFixtureBundle());

  it("loads five synthetic deployments", () => {
    expect(ctx.listDeployments()).toHaveLength(5);
  });

  it("ranks BRG-2047 highest risk (zero MW)", () => {
    const ranked = ctx.rankDeployments();
    expect(ranked[0]?.id).toBe("BRG-2047");
    expect(ranked[0]?.risk_score).toBeGreaterThan(50);
  });

  it("morning digest validates", () => {
    const digest = ctx.buildMorningDigest();
    const result = ctx.generateBrief("Morning ops digest");
    expect(result.validation.ok).toBe(true);
    expect(digest.fleet.total_contracted_mw).toBe(99);
  });

  it("SLA breach scenario routes to fleet scan", () => {
    const result = ctx.generateBrief("If BRG-1102 slips 4 weeks, who breaches SLA?");
    expect(result.validation.ok).toBe(true);
    expect(result.brief.summary.toLowerCase()).toContain("sla");
  });

  it("deployment brief cites sources", () => {
    const result = ctx.generateBrief("Deployment BRG-2047 is red — what happened?");
    expect(result.validation.ok).toBe(true);
    expect(result.brief.citations.some((c) => c.deployment_id === "BRG-2047")).toBe(true);
  });

  it("GFA tranche query returns gap figures", () => {
    const result = ctx.generateBrief("What is our 2026-H2 GFA tranche gap?");
    expect(result.brief.summary).toContain("2026-H2");
    expect(result.validation.ok).toBe(true);
  });
});
