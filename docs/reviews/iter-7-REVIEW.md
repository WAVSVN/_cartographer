# iter-7 REVIEW — Wave 4 MCP stdio server

**Commit:** bc5aafb  
**Reviewer:** iter 7  
**Verdict:** CONVERGED

## Summary

Wave 4 adds `@cartographer/mcp` — a stdio MCP server that exposes all seven `TOOL_SCHEMAS` from `@cartographer/core`, delegates `tools/call` to `OpsContext.callTool()` backed by `loadFixtureBundle()`, and ships a `cartographer-mcp` bin entry plus `docs/MCP.md` Cursor config. Root `npm run build` and `npm test` pass (10 vitest total).

## MCP checklist

| Area | Status | Notes |
|------|--------|-------|
| Stdio transport | PASS | `StdioServerTransport` in `startMcpServer()` |
| `tools/list` — 7 tools | PASS | `toMcpTools()` maps `TOOL_SCHEMAS` name/description/inputSchema |
| `tools/call` delegation | PASS | `CallToolRequestSchema` → `ops.callTool(name, args)` |
| Fixture bundle | PASS | `new OpsContext(loadFixtureBundle())` on startup |
| Bin entry | PASS | `cartographer-mcp` → `bin/cartographer-mcp.js` (imports built `dist/server.js`) |
| Error formatting | PASS | `formatToolResult` sets `isError: true` when result has `error` key |
| `docs/MCP.md` | PASS | Tool table, build/run, two Cursor `mcp.json` examples |
| Root build | PASS | `@cartographer/mcp` in workspace build chain |
| Root test | PASS | 4 MCP vitest + 6 core vitest |

## Findings

### HIGH

(none)

### MEDIUM

(none)

### LOW

1. No integration test exercising MCP SDK request handlers end-to-end over stdio (unit tests cover mapping + delegation; acceptable for v1.1).
2. Bin requires `npm run build -w @cartographer/mcp` before `npx cartographer-mcp` — documented in `docs/MCP.md`.
3. `null` tool results (e.g. unknown deployment ID) return success content with `null` JSON, not `isError` — matches core `callTool` semantics.

## Passed

- [x] `packages/mcp` with `@cartographer/mcp` and `cartographer-mcp` bin
- [x] All 7 `TOOL_SCHEMAS` exposed via MCP tools
- [x] Delegates to `OpsContext.callTool()` with `loadFixtureBundle()`
- [x] `docs/MCP.md` with Cursor config example
- [x] `npm run build` + `npm test` green

## Next

Wave 4 complete. **PR_AGENT:** open v1.1 PR `rebuild/v1` → `main` (MCP extension; PR #1 already merged).
