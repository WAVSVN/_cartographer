# STATE

| Field | Value |
|-------|-------|
| phase | wave-1 |
| branch | rebuild/v1 |
| iteration | 1 |
| last_commit | (pending) |
| open_pr | none |
| blockers | none |

## Acceptance (v1)

- [x] Repo created
- [x] Monorepo + strict TypeScript
- [x] Zod schemas at boundaries
- [ ] Core domain tests green
- [ ] API parity with grid-ops-brief
- [ ] UI parity
- [ ] Deployed to Vercel

## Next wave

Port remaining domain services (scenario, digest, brief engine) and wire `apps/web` API routes.
