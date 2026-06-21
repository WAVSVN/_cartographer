# WAVE HANDOFF — product phase

| Field | Value |
|-------|-------|
| **active_role** | `REVIEWER` |
| **wave** | P6 |
| **branch** | `product/p6-incident-workspace` |
| **trunk** | `main` |
| **pr** | https://github.com/WAVSVN/_cartographer/pull/8 |
| **sha** | `91dfac4` |

## REVIEWER — P6 incident workspace

See `docs/PRODUCT-ROADMAP.md` P6 acceptance checklist.

Shipped:
- `GET /api/scenario` — `deployment_id`, `slip_weeks` (default 4) → `ScenarioResult` or 404
- `lib/runbook-checks.ts` — `goc-runbook-checks` localStorage; `toggleStep`, `isStepChecked`; tested
- **DeploymentDetail** — runbook step checkboxes; +2w/+4w scenario chips; `ScenarioPanel` inline
- **Copy link** — clipboard `/?deploy=ID` (+ tranche when set); brief "Copied" feedback

`npm run build` + `npm test` green · PR #8 submitted.

## Prior

P1–P5 merged
