# WAVE HANDOFF — product phase

| Field | Value |
|-------|-------|
| **phase** | `product` |
| **active_role** | `REVIEWER` |
| **wave** | P5 |
| **branch** | `product/p5-sla-urgency` |
| **trunk** | `main` |
| **repo_path** | `c:\WAVSVN\components\_cartographer` |
| **review_tool** | Graphite (`gt submit`) |
| **pr** | https://github.com/WAVSVN/_cartographer/pull/7 |
| **sha** | c8a414c |

## REVIEWER — P5 SLA urgency + drill-down

See `docs/PRODUCT-ROADMAP.md` P5 acceptance.

**Shipped:** `product(p5): SLA urgency, overdue strip, auto-refresh, pipeline/fleet drill-down` (c8a414c)

### Review checklist

- [ ] `lib/sla-urgency.ts` — bands overdue / critical ≤7d / warning ≤14d / ok; tests green
- [ ] `SlaCountdown` — console queue, DeploymentDetail deadline, PipelineView DaysCell
- [ ] `OverdueAlertStrip` — visible when overdue > 0; click sets overdue filter
- [ ] OpsConsole — 5min silent refresh preserves `selectedId`; `?tranche=` filters queue
- [ ] PipelineView — All | Overdue | Due ≤14d chips; sort soonest deadline first
- [ ] FleetView — stressed tranche `View N` → `/?tranche=TRANCHE`
- [ ] `npm run build` + `npm test` green

Write `docs/reviews/product-p5-REVIEW.md` with verdict CONVERGED or findings.

## Prior merged

P1–P4 — `docs/reviews/product-p*-REVIEW.md`
