# WAVE HANDOFF — read this first

| Field | Value |
|-------|-------|
| **active_role** | `REVIEWER` |
| **wave** | 4 |
| **iteration** | 7 |
| **branch** | `rebuild/v1` |
| **repo_path** | `c:\WAVSVN\components\_cartographer` |
| **last_commit** | `bc5aafb` |
| **deploy_url** | https://cartographer-wavsvns-projects.vercel.app |
| **blockers** | none |

## Current task (REVIEWER — Wave 4 MCP)

Readonly review of Wave 4 MCP stdio server:

1. `packages/mcp` — `@cartographer/mcp` with `cartographer-mcp` bin
2. All 7 `TOOL_SCHEMAS` exposed via MCP `tools/list` + `tools/call`
3. Delegates to `OpsContext.callTool()` with `loadFixtureBundle()`
4. `docs/MCP.md` — Cursor `mcp.json` example
5. Root `npm run build` + `npm test` green

Write review → `docs/reviews/iter-7-REVIEW.md`

## After REVIEWER — spawn next role per loop

## Notes

- v1 PR #1 merged to `main` (2026-06-11)
- Wave 4 was skipped in v1; this is v1.1 extension on `rebuild/v1`
- Wave 4 MCP landed in `bc5aafb`
