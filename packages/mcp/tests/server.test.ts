import { describe, expect, it } from "vitest";
import { loadFixtureBundle } from "@cartographer/data";
import { OpsContext, TOOL_SCHEMAS } from "@cartographer/core";
import { formatToolResult, toMcpTools } from "../src/server.js";

describe("cartographer MCP server", () => {
  const ops = new OpsContext(loadFixtureBundle());

  it("exports all seven tools from TOOL_SCHEMAS", () => {
    const tools = toMcpTools();
    expect(tools).toHaveLength(7);
    expect(tools.map((t) => t.name)).toEqual(TOOL_SCHEMAS.map((s) => s.name));
    for (const tool of tools) {
      expect(tool.description).toBeTruthy();
      expect(tool.inputSchema.type).toBe("object");
    }
  });

  it("delegates get_deployment to OpsContext.callTool", () => {
    const result = ops.callTool("get_deployment", { deployment_id: "BRG-2047" });
    const formatted = formatToolResult(result);
    const parsed = JSON.parse(formatted.content[0]!.text);
    expect(parsed.id).toBe("BRG-2047");
    expect(formatted.isError).toBeUndefined();
  });

  it("returns isError for unknown tools", () => {
    const formatted = formatToolResult(ops.callTool("nonexistent_tool", {}));
    expect(formatted.isError).toBe(true);
    expect(JSON.parse(formatted.content[0]!.text).error).toContain("unknown tool");
  });

  it("list_exceptions returns deployments", () => {
    const result = ops.callTool("list_exceptions", {});
    expect(Array.isArray(result)).toBe(true);
    expect((result as unknown[]).length).toBeGreaterThan(0);
  });
});
