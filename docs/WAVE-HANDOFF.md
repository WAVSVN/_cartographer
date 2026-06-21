# WAVE HANDOFF — read this first

| Field | Value |
|-------|-------|
| **active_role** | `BUILDER` |
| **wave** | 4 |
| **iteration** | 6 |
| **branch** | `rebuild/v1` |
| **repo_path** | `c:\WAVSVN\components\_cartographer` |
| **last_commit** | `c90b38e` |
| **deploy_url** | https://cartographer-wavsvns-projects.vercel.app |
| **blockers** | none |

## Current task (BUILDER — Wave 4 MCP)

Per `docs/REBUILD-SPEC.md` Wave 4:

1. Create `packages/mcp` — stdio MCP server
2. Expose all 7 tools from `TOOL_SCHEMAS` via MCP `tools/list` + `tools/call`
3. Delegate to `OpsContext.callTool()` — load fixtures via `@cartographer/data`
4. Add bin entry e.g. `cartographer-mcp` in package.json
5. Use `@modelcontextprotocol/sdk` (stdio transport)
6. Add README snippet for Cursor MCP config
7. `npm run build` + `npm test` green; add package to root workspaces build chain
8. Commit `wave(4): MCP stdio server`, push `rebuild/v1`
9. Set `active_role` → `REVIEWER`, bump iteration

## After BUILDER — spawn REVIEWER

Readonly review → `docs/reviews/iter-6-REVIEW.md`

## Notes

- v1 PR #1 merged to `main` (2026-06-11)
- Wave 4 was skipped in v1; this is v1.1 extension on `rebuild/v1`
