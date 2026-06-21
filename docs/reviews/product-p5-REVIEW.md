# product-p5 REVIEW — SLA urgency + drill-down

**Commit:** c8a414c (feature) + reviewer fix (OverdueAlertStrip sync)  
**PR:** https://github.com/WAVSVN/_cartographer/pull/7  
**Reviewer:** P5 iter 1  
**Verdict:** CONVERGED

## Summary

P5 ships SLA urgency bands, shared countdown styling, overdue alert strip, 5-minute silent queue refresh (preserves selection), pipeline filter chips with deadline sort, and fleet stressed-tranche drill-down into the console via `?tranche=`.

## P5 acceptance checklist

| Criterion | Status | Evidence |
|-----------|--------|----------|
| `lib/sla-urgency.ts` — overdue / critical ≤7d / warning ≤14d / ok | PASS | `urgencyLevel`, helpers; `sla-urgency.test.ts` (4 tests) |
| `SlaCountdown` — console queue + detail + pipeline | PASS | `OpsConsole`, `DeploymentDetail` deadline, `PipelineView` DaysCell |
| Overdue alert strip when overdue > 0; click → Overdue filter | PASS | `OverdueAlertStrip`; `onOverdueClick` → `setFilter("overdue")` |
| Queue auto-refresh 5 min; preserve selection | PASS | `REFRESH_MS`; `loadRanked` interval; no `setSelectedId` on refresh |
| Pipeline — All \| Overdue \| Due ≤14d; sort soonest first | PASS | `PIPELINE_FILTERS`; `sortByDeadline` |
| Fleet — stressed tranche → `/?tranche=` | PASS | `FleetView` `View N` links |
| `npm run build` + `npm test` | PASS | Green (6 core + 4 mcp + 12 web vitest) |
| `gt submit` → PR | PASS | PR #7 on `product/p5-sla-urgency` |

## Component review

| Area | Status | Notes |
|------|--------|-------|
| `sla-urgency.ts` | PASS | Bands match spec; overdue shares critical styling |
| `SlaCountdown.tsx` | PASS | Thin wrapper over urgency helpers |
| `OverdueAlertStrip.tsx` | PASS | Reviewer fix: count from parent `ranked` (syncs with 5min refresh) |
| `OpsConsole.tsx` | PASS | Refresh interval, tranche URL filter, overdue strip |
| `PipelineView.tsx` | PASS | Chips + deadline sort |
| `FleetView.tsx` | PASS | Stressed count drill-down links |
| `DeploymentDetail.tsx` | PASS | Deadline row uses `SlaCountdown` |

## Findings

### HIGH

(none)

### MEDIUM

(none)

### LOW

1. **Fixed in review:** `OverdueAlertStrip` originally fetched `/api/deployments` once on mount — stale vs 5min queue refresh. Now derives `overdueCount` from `ranked` in `OpsConsole`.
2. Overdue strip sits below sticky site header (top of console), not inside `<header>` — acceptable for ops console layout.
3. `?filter=overdue` deep link still supported via boot effect; strip uses in-app `setFilter` (no URL update) — consistent with P4 filter UX.

## Verification

```text
npm run build  → PASS
npm test       → PASS (22 vitest total: 6 core + 4 mcp + 12 web)
```

## Next

P5 CONVERGED. Merge PR #7 → `main`. Product waves P1–P5 complete per `docs/PRODUCT-ROADMAP.md`.
