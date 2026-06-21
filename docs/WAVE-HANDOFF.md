# WAVE HANDOFF

| active_role | BUILDER |
| wave | P9 |
| branch | product/p9-shift-onboarding |

## BUILDER — P9 shift onboarding

See `docs/PITCH.md` + PRODUCT-ROADMAP P9.

1. `gt create product/p9-shift-onboarding` from main
2. `lib/onboarding.ts` — load/save `goc-onboarding-done`
3. `ShiftOnboarding.tsx` — 3-step coach marks or compact modal:
   - Step 1: Run morning digest (toolbar Digest or auto)
   - Step 2: Open top exception in queue (select first ranked)
   - Step 3: Open Handoff — add note or export preview
4. Wire into OpsConsole; callbacks from ConsoleToolbar for handoff open
5. Copy from PITCH 60s demo — operator language

Ship `product(p9): shift onboarding — first-run guide` → REVIEWER
