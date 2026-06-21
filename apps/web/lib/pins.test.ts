import { describe, expect, it } from "vitest";
import { isPinned, pin, sortWithPinsFirst, togglePin, unpin } from "./pins";

describe("pins", () => {
  it("pins and unpins deployment ids", () => {
    let pins: string[] = [];
    pins = pin(pins, "BRG-2047");
    expect(isPinned(pins, "BRG-2047")).toBe(true);
    pins = pin(pins, "BRG-2047");
    expect(pins).toEqual(["BRG-2047"]);
    pins = unpin(pins, "BRG-2047");
    expect(isPinned(pins, "BRG-2047")).toBe(false);
  });

  it("toggles pin state", () => {
    let pins = togglePin([], "BRG-1102");
    expect(pins).toEqual(["BRG-1102"]);
    pins = togglePin(pins, "BRG-1102");
    expect(pins).toEqual([]);
  });

  it("sorts pinned deployments to the top in pin order", () => {
    const list = [
      { id: "BRG-2047", rank: 1 },
      { id: "BRG-1102", rank: 2 },
      { id: "PRM-3001", rank: 3 },
    ];
    const sorted = sortWithPinsFirst(list, ["PRM-3001", "BRG-2047"]);
    expect(sorted.map((d) => d.id)).toEqual(["PRM-3001", "BRG-2047", "BRG-1102"]);
  });
});
