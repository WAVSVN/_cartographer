# Cartographer — orchestration

Multi-agent rebuild pipeline for Grid Ops Command (clean rewrite from `grid-ops-brief`).

## Roles

| Role | Artifact | Rule |
|------|----------|------|
| Auditor | `docs/AUDIT.md`, `docs/REBUILD-SPEC.md` | No implement |
| Builder | code + `STATE.md` | Atomic commits per wave |
| Reviewer | `docs/reviews/iter-N-REVIEW.md` | Fresh subagent, readonly |
| PR agent | GitHub PR | After reviewer CONVERGED for milestone |

## Waves (rebuild/v1 branch)

| Wave | Scope | Done when |
|------|-------|-----------|
| 0 | Monorepo, schemas, docs | build passes |
| 1 | `@cartographer/core` domain + vitest | tests green |
| 2 | `apps/web` API routes (thin) | API parity |
| 3 | UI console, fleet, pipeline | visual parity |
| 4 | MCP stdio server package | optional |

## Convergence

Stop when: reviewer `CONVERGED` + `npm run build` + `npm test` + acceptance in `REBUILD-SPEC.md`.

## Commit format

```
wave(N): short imperative summary

Why: one sentence.
Tests: what ran.
```

## Remote

https://github.com/WAVSVN/_cartographer
