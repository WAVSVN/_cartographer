# WAVE HANDOFF — read this first

> Single bus file for the multi-agent loop. **Update after every role completes.**

| Field | Value |
|-------|-------|
| **active_role** | `PR_AGENT` |
| **wave** | 5 |
| **iteration** | 4 |
| **branch** | `rebuild/v1` |
| **repo_path** | `c:\WAVSVN\components\_cartographer` |
| **last_commit** | `3a90655` |
| **deploy_url** | https://cartographer-wavsvns-projects.vercel.app |
| **blockers** | none |

## Current task (PR_AGENT — open PR)

Wave 5 deploy **complete**. Vercel project `cartographer` under WAVSVN; monorepo root `apps/web` + Git on `rebuild/v1`.

1. Open PR `rebuild/v1` → `main` with test plan + deploy URL above
2. Verification checklist (all 200): `/`, `/fleet`, `/pipeline`, `/about`, `GET /api/*`, `POST /api/brief`
3. Write `CONVERGED.md` after PR is open

**Deploy notes:** `docs/DEPLOY.md`

## Do not

- Re-implement domain logic in UI (use API routes).
- Skip commit/push between waves.
- Use pnpm (host uses **npm workspaces**).
