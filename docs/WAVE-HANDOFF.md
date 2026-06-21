# WAVE HANDOFF

| active_role | REVIEWER |
| wave | P9 |
| branch | product/p9-shift-onboarding |
| pr | https://github.com/WAVSVN/_cartographer/pull/11 |
| sha | 2639511dc12819f8957d5deb6797cb74f0897093 |

## REVIEWER — P9 shift onboarding

Builder shipped first-run shift guide on console. Verify P9 acceptance in `docs/PRODUCT-ROADMAP.md`.

### What changed

- `apps/web/lib/onboarding.ts` — `isOnboardingDone()` / `markOnboardingDone()` via `goc-onboarding-done`
- `apps/web/components/ShiftOnboarding.tsx` — 3-step compact card (digest → top queue item → handoff)
- `OpsConsole` — shows overlay when onboarding incomplete on mount
- `ConsoleToolbar` — `forwardRef` + `openHandoff()`; `onHandoffExport` completes tour

### Verify

```powershell
cd c:\WAVSVN\components\_cartographer
git checkout product/p9-shift-onboarding
npm run build && npm run test
```

Manual: clear `localStorage.goc-onboarding-done`, reload `/` — tour appears; Skip / Done / Export all persist dismiss.

### Prior builder notes

See `docs/PITCH.md` 60s demo script for operator copy intent.
