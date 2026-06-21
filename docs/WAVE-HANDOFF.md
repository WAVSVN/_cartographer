# WAVE HANDOFF — product phase

| Field | Value |
|-------|-------|
| **active_role** | `BUILDER` |
| **wave** | P6 |
| **branch** | `product/p6-incident-workspace` |
| **trunk** | `main` |

## BUILDER — P6 incident workspace

See `docs/PRODUCT-ROADMAP.md` P6.

1. `gt sync` → `gt create product/p6-incident-workspace`
2. API `GET /api/scenario` — query params deployment_id, slip_weeks (default 4)
3. `lib/runbook-checks.ts` + tests
4. DeploymentDetail: runbook checklist, +2w/+4w scenario chips, ScenarioResult inline panel, copy link
5. Ship `product(p6): incident workspace — runbook checks, quick scenarios` + `gt submit`

Handoff → REVIEWER

## Prior

P1–P5 merged
