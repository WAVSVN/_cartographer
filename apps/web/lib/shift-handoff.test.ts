import { describe, expect, it } from "vitest";
import type { RiskRankedDeployment } from "@/lib/types";
import {
  addShiftNote,
  buildHandoffBundle,
  buildMarkdown,
  collectOpenExceptions,
  handoffFilename,
} from "./shift-handoff";

const ranked: RiskRankedDeployment[] = [
  {
    id: "BRG-2047",
    name: "Bridge Zero",
    type: "bridge",
    status: "exception",
    customer_id: "c1",
    site: "Site A",
    mw_contracted: 20,
    mw_available: 0,
    equipment: "gen",
    gfa_tranche: "2026-H1",
    commissioning_deadline: "2026-03-01",
    exception_code: "MW_GAP",
    exception_summary: "Zero MW available",
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
    site: "Site B",
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

describe("shift-handoff", () => {
  it("collects exceptions and active triage", () => {
    const open = collectOpenExceptions(ranked, {
      "BRG-1102": {
        state: "investigating",
        updatedAt: "2026-06-21T10:00:00.000Z",
        note: "Checking SLA",
      },
    });
    expect(open.map((e) => e.id)).toEqual(["BRG-2047", "BRG-1102"]);
    expect(open[0]?.triageState).toBe("unacked");
    expect(open[1]?.triageNote).toBe("Checking SLA");
  });

  it("builds markdown with fleet and notes", () => {
    const notes = addShiftNote([], "Handed off to night shift");
    const bundle = buildHandoffBundle({
      ranked,
      triageMap: {},
      shiftNotes: notes,
      history: [],
      fleet: {
        total_contracted_mw: 99,
        total_available_mw: 80,
        total_gap_mw: 19,
        deployment_count: 5,
        by_type: {
          bridge: { contracted_mw: 60, available_mw: 45, gap_mw: 15, count: 3 },
          permanent: { contracted_mw: 39, available_mw: 35, gap_mw: 4, count: 2 },
        },
        by_tranche: {},
        by_basin: {},
      },
      exportedAt: new Date("2026-06-21T14:30:00.000Z"),
    });
    const md = buildMarkdown(bundle);
    expect(md).toContain("# Shift handoff");
    expect(md).toContain("99 MW");
    expect(md).toContain("BRG-2047");
    expect(md).toContain("Handed off to night shift");
    expect(md).toContain("## Top risks");
  });

  it("includes audit log in handoff markdown", () => {
    const bundle = buildHandoffBundle({
      ranked,
      triageMap: {},
      shiftNotes: [],
      history: [],
      fleet: null,
      auditLog: [
        {
          id: "a1",
          action: "triage_change",
          at: "2026-06-21T10:00:00.000Z",
          deployment_id: "BRG-2047",
          detail: "investigating",
        },
      ],
    });
    const md = buildMarkdown(bundle);
    expect(md).toContain("## Action audit log");
    expect(md).toContain("investigating");
    expect(md).toContain("BRG-2047");
  });

  it("formats handoff filename", () => {
    expect(handoffFilename(new Date("2026-06-21T14:30:00.000Z"))).toBe(
      "shift-handoff-2026-06-21-1430.md"
    );
  });
});
