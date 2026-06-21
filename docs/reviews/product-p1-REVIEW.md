# product-p1 REVIEW — Operator-first console

**Commit:** 9833368 (feature) + a93bc5d (handoff)  
**PR:** https://github.com/WAVSVN/_cartographer/pull/3  
**Reviewer:** P1 iter 1  
**Verdict:** CONVERGED

## Summary

P1 shifts the ops console from interview-demo flow to operator-first triage: queue selection loads deployment detail + inline runbook via `GET /api/deployment/[id]` without auto-brief; brief generation is explicit (button + Enter when detail focused). Interview playbook → Shift actions; header `demo` badge → live shift clock. Keyboard nav (j/k, /, ?, Escape) and queue filters (All / Exception / Watch / Overdue) ship with `ShortcutsHelp` overlay.

## P1 acceptance checklist

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Queue select → detail + runbook, no auto-brief | PASS | `selectDeployment` → `loadDetail`; queue click no longer calls `runBrief` |
| "Generate brief" explicit | PASS | `DeploymentDetail` button; Enter when detail panel focused |
| Interview playbook → Shift actions | PASS | `SHIFT_ACTIONS`, panel title "Shift actions" |
| Header shift clock, not `demo` | PASS | `ShiftClock` in `layout.tsx` |
| Keyboard j/k, /, ?, Escape | PASS | `OpsConsole` keydown handler + `ShortcutsHelp` |
| Filters All / Exception / Watch / Overdue | PASS | `filterRanked` + tablist UI |
| `GET /api/deployment/[id]` | PASS | Returns `{ deployment, contract, runbook, risk }`; smoke-tested BRG-2047 |
| `npm run build` + `npm test` | PASS | Green (6 core + 4 mcp vitest) |
| Graphite PR for review | PASS | PR #3 open, mergeable |

## Component review

| Area | Status | Notes |
|------|--------|-------|
| `OpsConsole.tsx` | PASS | Detail-first layout; filters; keyboard; removed boot auto-digest |
| `DeploymentDetail.tsx` | PASS | Facts, SLA, MW, equipment, contract, exception, risk, runbook steps |
| `api/deployment/[id]/route.ts` | PASS | 404 on unknown id; runbook when `exception_code` set |
| `ShiftClock.tsx` | PASS | Local 24h time, monospace, 60s tick |
| `ShortcutsHelp.tsx` | PASS | Modal overlay, Escape to close |

## Findings

### HIGH

(none)

### MEDIUM

(none)

### LOW

1. `?` toolbar button is `hidden sm:inline-flex`; keyboard `?` still works on mobile.
2. Changing queue filter does not auto-reselect when current deployment drops out of filtered list (j/k still navigates filtered set).
3. `/about` still references "60-second demo path" — out of P1 scope; consider cleanup in a later polish pass.

## Verification

```text
npm run build  → PASS
npm test       → PASS (10 vitest)
GET /api/deployment/BRG-2047 → deployment + contract + runbook + risk
```

## Next

P1 CONVERGED. Merge PR #3 → `main`. Hand off **BUILDER** for P2 (`product/p2-triage-state`): ack / investigating / escalated per deployment (localStorage + UI). See `docs/PRODUCT-ROADMAP.md`.
