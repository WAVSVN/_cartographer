import { describe, expect, it } from "vitest";
import { getGraphIntegrationStatus, graphIntegrationMode } from "./azure-graph";

describe("azure-graph integration", () => {
  it("defaults to fixture mode without Azure env", () => {
    expect(graphIntegrationMode()).toBe("fixture");
  });

  it("returns Graph-shaped shift signals in fixture mode", async () => {
    const status = await getGraphIntegrationStatus();
    expect(status.mode).toBe("fixture");
    expect(status.signals.length).toBeGreaterThan(0);
    expect(status.signals[0]).toMatchObject({
      type: expect.stringMatching(/calendar|mail|teams/),
      title: expect.any(String),
      source: expect.any(String),
    });
  });
});
