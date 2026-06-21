# WAVE HANDOFF — read this first

> Single bus file for the multi-agent loop. **Update after every role completes.**

| Field | Value |
|-------|-------|
| **active_role** | `BUILDER` |
| **wave** | 5 |
| **iteration** | 4 |
| **branch** | `rebuild/v1` |
| **repo_path** | `c:\WAVSVN\components\_cartographer` |
| **last_commit** | (pending review commit) |
| **blockers** | none |

## Current task (BUILDER — Wave 5 deploy + PR prep)

Wave 3 UI review **CONVERGED** (`docs/reviews/iter-4-REVIEW.md`). Wave 4 MCP skipped (optional).

1. Create Vercel project under WAVSVN account for `apps/web`
2. Deploy `rebuild/v1` branch — root directory `apps/web` or monorepo config as needed
3. Verify live URL serves `/`, `/fleet`, `/pipeline`, `/about` with API routes
4. Commit any `vercel.json` / env notes; push `rebuild/v1`
5. Handoff **PR_AGENT** — open PR `rebuild/v1` → `main` with test plan + deploy URL

**Acceptance:** REBUILD-SPEC global — deployed to Vercel under WAVSVN.

## After BUILDER — spawn PR_AGENT per ORCHESTRATION.md

PR_AGENT writes `CONVERGED.md` after PR is open.

## Do not

- Re-implement domain logic in UI (use API routes).
- Skip commit/push between waves.
- Use pnpm (host uses **npm workspaces**).
