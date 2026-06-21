# WAVE HANDOFF — read this first

> Single bus file for the multi-agent loop. **Update after every role completes.**

| Field | Value |
|-------|-------|
| **active_role** | `REVIEWER` |
| **wave** | 3 |
| **iteration** | 4 |
| **branch** | `rebuild/v1` |
| **repo_path** | `c:\WAVSVN\components\_cartographer` |
| **last_commit** | `e7c6a30` |
| **blockers** | none |

## Current task (REVIEWER — Wave 3 UI parity)

Review wave 3 commit `e7c6a30` vs REBUILD-SPEC Wave 3:

1. Ops console (`/`) — risk-ranked queue, scenario chat, morning digest
2. Fleet (`/fleet`) — MW/GFA rollups
3. Pipeline (`/pipeline`) — bridge→permanent deadlines, mobile cards
4. About (`/about`) — integration map

**Verify:** visual parity ~8/10 vs prototype; mobile pipeline cards; `npm run build` + `npm test` green.

**Deliverable:** `docs/reviews/iter-4-REVIEW.md` with verdict `CONVERGED` or `BLOCKED`.

## After REVIEWER — spawn next role per ORCHESTRATION.md

If CONVERGED → wave 4 (MCP optional) or wave 5 (deploy).

## Do not

- Re-implement domain logic in UI (use API routes).
- Skip commit/push between waves.
- Use pnpm (host uses **npm workspaces**).
