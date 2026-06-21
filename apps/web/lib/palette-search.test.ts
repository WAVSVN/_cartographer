import { describe, expect, it } from "vitest";
import type { RiskRankedDeployment } from "@/lib/types";
import { buildPaletteItems, searchPaletteItems } from "./palette-search";

const deployments: RiskRankedDeployment[] = [
  {
    id: "BRG-2047",
    name: "Bridge Zero",
    type: "bridge",
    status: "exception",
    customer_id: "c1",
    site: "Permian Basin",
    mw_contracted: 20,
    mw_available: 0,
    equipment: "gen",
    gfa_tranche: "2026-H1",
    commissioning_deadline: "2026-03-01",
    exception_code: "MW_GAP",
    exception_summary: "Zero MW",
    tags: [],
    risk_score: 92,
    mw_gap: 20,
    days_to_deadline: -10,
    sla_pct: 99.5,
  },
  {
    id: "BRG-1102",
    name: "Bridge OK",
    type: "bridge",
    status: "healthy",
    customer_id: "c2",
    site: "Eagle Ford",
    mw_contracted: 15,
    mw_available: 15,
    equipment: "gen",
    gfa_tranche: "2026-H2",
    commissioning_deadline: null,
    exception_code: null,
    exception_summary: null,
    tags: [],
    risk_score: 10,
    mw_gap: 0,
    days_to_deadline: null,
    sla_pct: 99.9,
  },
];

const actions = [
  { step: 1, label: "Morning digest", query: "Morning ops digest", digest: true },
  { step: 2, label: "Triage exception", query: "Deployment BRG-2047 is red" },
];

describe("palette-search", () => {
  it("builds deployment and action items", () => {
    const items = buildPaletteItems(deployments, actions);
    expect(items).toHaveLength(4);
    expect(items[0]?.kind).toBe("deployment");
    expect(items[2]?.kind).toBe("action");
  });

  it("searches by id, name, and site", () => {
    const items = buildPaletteItems(deployments, actions);
    expect(searchPaletteItems(items, "2047").map((i) => i.label)).toEqual(["BRG-2047"]);
    expect(searchPaletteItems(items, "eagle").map((i) => i.label)).toEqual(["BRG-1102"]);
    expect(searchPaletteItems(items, "digest").map((i) => i.label)).toEqual(["Morning digest"]);
  });
});
