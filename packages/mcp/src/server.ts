import { OpsContext, TOOL_SCHEMAS } from "@cartographer/core";
import { loadFixtureBundle } from "@cartographer/data";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

export function toMcpTools() {
  return TOOL_SCHEMAS.map((schema) => ({
    name: schema.name,
    description: schema.description,
    inputSchema: schema.parameters,
  }));
}

export function createMcpServer(ops: OpsContext) {
  const server = new Server(
    { name: "cartographer-mcp", version: "0.1.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: toMcpTools(),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const name = request.params.name;
    const args = (request.params.arguments ?? {}) as Record<string, unknown>;
    return formatToolResult(ops.callTool(name, args));
  });

  return server;
}

export function formatToolResult(result: unknown) {
  if (result && typeof result === "object" && "error" in result) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result) }],
      isError: true,
    };
  }

  return {
    content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
  };
}

export async function startMcpServer() {
  const ops = new OpsContext(loadFixtureBundle());
  const server = createMcpServer(ops);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
