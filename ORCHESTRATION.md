# Cartographer — orchestration

Multi-agent rebuild pipeline for Grid Ops Command (clean rewrite from `grid-ops-brief`).

**Loop entry:** read `docs/WAVE-HANDOFF.md` first. Cursor skill: `cartographer-loop` (`.cursor/skills/cartographer-loop/` in WAVSVN workspace).

## Roles

| Role | Artifact | Rule |
|------|----------|------|
| Auditor | `docs/AUDIT.md`, `docs/REBUILD-SPEC.md` | No implement |
| Builder | code + `STATE.md` + `WAVE-HANDOFF.md` | Atomic commits per wave; spawn Reviewer when done |
| Reviewer | `docs/reviews/iter-N-REVIEW.md` | Fresh subagent, readonly; spawn Builder or PR agent |
| PR agent | GitHub PR + `CONVERGED.md` | After all waves reviewer-CONVERGED |

## Loop (one turn)

```
WAVE-HANDOFF.active_role
    BUILDER  → implement wave → commit → push → handoff REVIEWER → spawn Reviewer
    REVIEWER → review → iter-N-REVIEW.md → handoff BUILDER (next wave) or PR_AGENT → spawn next
    PR_AGENT → gh pr create → CONVERGED.md → DONE
```

Repeat until `CONVERGED.md` or `active_role: DONE` (max 12 reviewer iterations).

## Waves (rebuild/v1 branch)

| Wave | Scope | Done when |
|------|-------|-----------|
| 0 | Monorepo, schemas, docs | build passes |
| 1 | `@cartographer/core` domain + vitest | tests green |
| 2 | `apps/web` API routes (thin) | API parity |
| 3 | UI console, fleet, pipeline | visual parity |
| 4 | MCP stdio server package | optional |
| 5 | Vercel deploy + PR | merged-ready |

## Convergence

Stop when: reviewer `CONVERGED` on final wave + `npm run build` + `npm test` + acceptance in `REBUILD-SPEC.md` + `CONVERGED.md` written.

## Commit format

```
wave(N): short imperative summary

Why: one sentence.
Tests: what ran.
```

## Remote

https://github.com/WAVSVN/_cartographer
