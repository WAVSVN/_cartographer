# WAVE HANDOFF — read this first

> Single bus file for the multi-agent loop. **Update after every role completes.**

| Field | Value |
|-------|-------|
| **active_role** | `BUILDER` |
| **wave** | 2 |
| **iteration** | 1 |
| **branch** | `rebuild/v1` |
| **repo_path** | `c:\WAVSVN\components\_cartographer` |
| **last_commit** | `1107c8c` wave(1) |
| **blockers** | none |

## Current task (BUILDER)

Implement **Wave 2** per `docs/REBUILD-SPEC.md`:

1. Scaffold `apps/web` (Next.js 15, TypeScript, App Router).
2. Wire workspace: root `package.json` → `"workspaces": ["packages/*", "apps/*"]`.
3. Add `apps/web/lib/ops.ts` singleton (`loadFixtureBundle` + `OpsContext`).
4. Implement API routes: `/api/deployments`, `/api/fleet`, `/api/pipeline`, `/api/digest`, `/api/brief`.
5. Run `npm install`, `npm run build`, `npm test` from repo root.
6. Commit: `wave(2): apps/web API routes — core parity`
7. Push to `origin rebuild/v1`.
8. Update `STATE.md` and this file:
   - set `active_role` → `REVIEWER`
   - set `wave` → 2 (review targets wave 2 deliverable)
   - bump `iteration`
   - set `last_commit` to new SHA

## After BUILDER — spawn REVIEWER

Reviewer (fresh subagent, **readonly**):

1. Read diff since `last_commit` in handoff (or review wave commit).
2. Write `docs/reviews/iter-{N}-REVIEW.md` with verdict `CONVERGED` or `BLOCKED`.
3. Check: routes thin, Zod at boundaries if added, build/test green, API shape matches spec.
4. Update this file:
   - If `CONVERGED` and wave < 5: `active_role` → `BUILDER`, increment `wave`, write next task from REBUILD-SPEC.
   - If `BLOCKED`: `active_role` → `BUILDER`, same wave, list fixes in handoff.
   - If all waves done: `active_role` → `PR_AGENT`.

## After all waves — PR_AGENT

1. `gh pr create` from `rebuild/v1` → `main` with summary + test plan.
2. Write `CONVERGED.md` at repo root.
3. Set `active_role` → `DONE`.

## Do not

- Re-implement domain logic in routes (use `@cartographer/core`).
- Skip commit/push between waves.
- Use pnpm (host uses **npm workspaces**).
