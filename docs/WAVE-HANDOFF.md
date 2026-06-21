# WAVE HANDOFF — read this first

> Single bus file for the multi-agent loop. **Update after every role completes.**

| Field | Value |
|-------|-------|
| **active_role** | `REVIEWER` |
| **wave** | 2 |
| **iteration** | 2 |
| **branch** | `rebuild/v1` |
| **repo_path** | `c:\WAVSVN\components\_cartographer` |
| **last_commit** | `c45da6b` wave(2) |
| **blockers** | none |

## Current task (REVIEWER)

Review **Wave 2** deliverable (`c45da6b`):

1. Read diff since `1107c8c` (wave 1) or review wave 2 commit.
2. Write `docs/reviews/iter-2-REVIEW.md` with verdict `CONVERGED` or `BLOCKED`.
3. Check: routes thin, Zod at boundaries if added, build/test green, API shape matches spec.
4. Update this file per ORCHESTRATION.md (next BUILDER wave 3 or fixes if BLOCKED).

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
