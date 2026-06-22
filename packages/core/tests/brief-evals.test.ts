import { describe, expect, it } from "vitest";
import { loadFixtureBundle } from "@cartographer/data";
import { OpsContext } from "../src/index.js";

const GOLDEN_QUERIES: Array<{
  query: string;
  expectIntent?: string;
  mustContain?: RegExp;
  mustCite?: string;
}> = [
  {
    query: "Morning ops digest",
    expectIntent: "morning_digest",
    mustContain: /MW/i,
  },
  {
    query: "Deployment BRG-2047 is red — what happened?",
    expectIntent: "deployment_status",
    mustCite: "BRG-2047",
  },
  {
    query: "If BRG-1102 slips 4 weeks, who breaches SLA?",
    expectIntent: "sla_breach_scan",
    mustContain: /sla/i,
  },
  {
    query: "What is our 2026-H2 GFA tranche gap?",
    expectIntent: "tranche_gap",
    mustContain: /2026-H2/,
  },
  {
    query: "tell me about midland interconnection hold",
    expectIntent: "deployment_status",
    mustCite: "BRG-1102",
  },
];

describe("brief evals — regression golden set", () => {
  const ctx = new OpsContext(loadFixtureBundle());

  for (const case_ of GOLDEN_QUERIES) {
    it(`validates: ${case_.query.slice(0, 48)}…`, () => {
      const result = ctx.generateBrief(case_.query);
      expect(result.validation.ok).toBe(true);
      if (case_.expectIntent) expect(result.meta?.intent).toBe(case_.expectIntent);
      if (case_.mustContain) expect(result.brief.summary).toMatch(case_.mustContain);
      if (case_.mustCite) {
        expect(
          result.brief.citations.some((c) => c.deployment_id === case_.mustCite) ||
            result.brief.summary.includes(case_.mustCite!)
        ).toBe(true);
      }
    });
  }

  it("rejects hallucinated deployment IDs in citations via validator", () => {
    const bad = ctx.generateBrief("status of BRG-9999");
    expect(bad.brief.summary.toLowerCase()).toContain("no deployment");
  });
});
