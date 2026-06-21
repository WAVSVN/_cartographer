import { describe, expect, it } from "vitest";
import { isStepChecked, toggleStep } from "./runbook-checks";

describe("runbook-checks", () => {
  it("tracks checked steps per deployment", () => {
    let map = {};
    expect(isStepChecked(map, "BRG-2047", 0)).toBe(false);

    map = toggleStep(map, "BRG-2047", 0, 3);
    expect(isStepChecked(map, "BRG-2047", 0)).toBe(true);
    expect(isStepChecked(map, "BRG-2047", 1)).toBe(false);

    map = toggleStep(map, "BRG-2047", 0, 3);
    expect(isStepChecked(map, "BRG-2047", 0)).toBe(false);
  });

  it("isolates check state by deployment id", () => {
    let map = toggleStep({}, "BRG-2047", 1, 4);
    map = toggleStep(map, "PRM-3001", 0, 2);

    expect(isStepChecked(map, "BRG-2047", 1)).toBe(true);
    expect(isStepChecked(map, "BRG-2047", 0)).toBe(false);
    expect(isStepChecked(map, "PRM-3001", 0)).toBe(true);
    expect(isStepChecked(map, "PRM-3001", 1)).toBe(false);
  });

  it("pads step arrays to runbook length", () => {
    const map = toggleStep({}, "BRG-1102", 2, 5);
    expect(map["BRG-1102"]).toEqual([false, false, true, false, false]);
  });
});
