# WAVE HANDOFF — product phase

| Field | Value |
|-------|-------|
| **phase** | `product` |
| **active_role** | `BUILDER` |
| **wave** | P5 |
| **branch** | `product/p5-sla-urgency` |
| **trunk** | `main` |
| **repo_path** | `c:\WAVSVN\components\_cartographer` |
| **review_tool** | Graphite (`gt submit`) |

## BUILDER — P5 SLA urgency + drill-down

See `docs/PRODUCT-ROADMAP.md` P5 acceptance.

1. `gt sync` on main → `gt create product/p5-sla-urgency`
2. `lib/sla-urgency.ts` + tests
3. `components/SlaCountdown.tsx` — use in OpsConsole, DeploymentDetail, PipelineView DaysCell
4. `OverdueAlertStrip` — below FleetHealthStrip or in console; links to overdue filter
5. OpsConsole: 5min silent refresh; support `?tranche=` search param to filter queue by gfa_tranche
6. PipelineView: filter chips + sort by days_to_deadline asc
7. FleetView: per tranche with stressed_count>0, link "View N" → `/?tranche=TRANCHE`

Ship: `product(p5): SLA urgency, overdue strip, auto-refresh, pipeline/fleet drill-down`
`gt submit` → handoff REVIEWER

## Prior merged

P1–P4 — `docs/reviews/product-p*-REVIEW.md`
