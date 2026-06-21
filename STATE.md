# STATE

| Field | Value |
|-------|-------|
| phase | wave-1 complete |
| branch | rebuild/v1 |
| iteration | 1 |
| last_commit | wave(1): npm monorepo, schemas, data, core domain + vitest |
| open_pr | none |
| blockers | none |

## Acceptance (v1)

- [x] Repo created
- [x] Monorepo + strict TypeScript (npm workspaces; pnpm unavailable on host)
- [x] Zod schemas at boundaries
- [x] Core domain tests green (6 vitest)
- [ ] API parity with grid-ops-brief
- [ ] UI parity
- [ ] Deployed to Vercel

## Next wave

`apps/web` — thin Next.js API routes importing `@cartographer/core` + `@cartographer/data`.
