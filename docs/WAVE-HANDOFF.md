# WAVE HANDOFF — read this first

> Single bus file for the multi-agent loop. **Update after every role completes.**

| Field | Value |
|-------|-------|
| **active_role** | `BUILDER` |
| **wave** | 3 |
| **iteration** | 3 |
| **branch** | `rebuild/v1` |
| **repo_path** | `c:\WAVSVN\components\_cartographer` |
| **last_commit** | (pending wave 3) |
| **blockers** | none |

## Current task (BUILDER — Wave 3 UI parity)

Port pages from prototype `c:\WAVSVN\components\grid-ops-brief\site`:

1. Ops console (`/`) — risk-ranked queue, scenario chat, morning digest
2. Fleet (`/fleet`) — MW/GFA rollups
3. Pipeline (`/pipeline`) — bridge→permanent deadlines, mobile cards
4. About (`/about`) — integration map

**Requirements:**

- Tailwind styling; fetch from local API routes (not direct core imports in client components)
- Shared nav/layout matching prototype UX
- **Done when:** visual parity ~8/10 vs prototype; mobile pipeline cards work

**Verify:** `npm run build` + `npm test` from repo root.

**Git:** commit `wave(3): UI console, fleet, pipeline, about`, push `rebuild/v1`.

**Handoff after success:** set `active_role` → `REVIEWER`, `wave` → 3, bump `iteration`, update `last_commit`.

## After BUILDER — spawn REVIEWER

Reviewer (fresh subagent, **readonly**):

1. Review wave commit vs REBUILD-SPEC Wave 3.
2. Write `docs/reviews/iter-{N}-REVIEW.md` with verdict `CONVERGED` or `BLOCKED`.
3. Update this file per ORCHESTRATION.md.

## Do not

- Re-implement domain logic in UI (use API routes).
- Skip commit/push between waves.
- Use pnpm (host uses **npm workspaces**).
