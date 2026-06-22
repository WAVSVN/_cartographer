# product-p9 REVIEW — shift onboarding

**Commit:** 2639511 (feature) + reviewer docs  
**PR:** https://github.com/WAVSVN/_cartographer/pull/11  
**Reviewer:** P9 iter 1  
**Verdict:** CONVERGED

## Summary

P9 adds a first-run shift guide on the ops console: compact 3-step overlay (digest → top queue item → handoff) backed by `goc-onboarding-done` localStorage. Step actions wire to real `runDigest`, queue selection, and `ConsoleToolbar.openHandoff()`; dismiss via Skip, Done, or handoff export.

## P9 acceptance checklist

| Criterion | Status | Evidence |
|-----------|--------|----------|
| `ShiftOnboarding` overlay on console first visit (`localStorage` `goc-onboarding-done`) | PASS | `OpsConsole` mount effect; `lib/onboarding.ts` key |
| 3 steps with clear operator copy (not interview/demo tone) | PASS | `ShiftOnboarding.tsx` STEPS — digest / triage / handoff |
| Step actions wire to real UX: run digest, select top queue item, open handoff toolbar | PASS | `onRunDigest` → `runDigest`; `selectTopQueueItem` → `filtered[0]`; `toolbarRef.openHandoff()` |
| Dismiss: "Skip" + complete on step 3; never blocks return visits | PASS | `dismissOnboarding` on Skip/Done; `onHandoffExport` on export |
| `npm run build` + `npm test` | PASS | Green (6 core + 4 mcp + 18 web vitest) |
| PR submitted | PASS | PR #11 on `product/p9-shift-onboarding` |

## Structural review

| Area | Status | Notes |
|------|--------|-------|
| `lib/onboarding.ts` | PASS | SSR-safe defaults; quota/private-mode tolerant |
| `ShiftOnboarding` UX | PASS | Non-blocking overlay (`pointer-events-none` shell); step progress label |
| `ConsoleToolbar` ref | PASS | `forwardRef` + `useImperativeHandle` for `openHandoff` |
| Digest error handling | PASS | Step 1 retries on failure; inline alert |
| Empty queue edge case | PASS | Step 2 primary disabled when `topItemId` null |
| P1–P8 regressions | PASS | No auto-brief, workbench layout, toolbar handoff intact |

## Findings

### HIGH

(none)

### MEDIUM

(none)

### LOW

1. Duplicate skip affordances — header "Skip" and footer "Skip tour" both call the same handler; cosmetic only.
2. Onboarding card uses `shadow-lg` while P7 flattened panels — acceptable for floating first-run card.
3. Tests cover `onboarding.ts` only; no RTL test for `ShiftOnboarding` step flow — acceptable for P9 scope.

## Verification

```text
npm run build  → PASS
npm test       → PASS (28 vitest total: 6 core + 4 mcp + 18 web)
```

## Next

P9 CONVERGED. Merge PR #11 → `main`. Per `docs/PITCH.md`, next priority is **P10 — Action audit log**.
