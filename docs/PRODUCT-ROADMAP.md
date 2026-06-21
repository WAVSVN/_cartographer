# Product roadmap — operator-first GOC

Shift from interview demo → **day-to-day private-grid ops console**.

## Who uses this daily

| Persona | Needs | Not this |
|---------|-------|----------|
| **Shift operator** | Triage exceptions, runbooks, SLA clocks, ack/escalate | Roadmap slides, playbook scripts |
| **Fleet engineer** | MW gap, equipment, commissioning dates | Chat-first AI theater |
| **Handoff lead** | Exportable shift summary, audit trail | Management-only dashboards |

## Interview smells to remove

- "Interview playbook" panel
- `demo` badge in header
- Auto-generating verbose brief on every queue click
- Scenario chat as the *primary* surface (keep as power feature, not default)

## Product waves (Graphite stack on `main`)

| Wave | Branch | Deliverable |
|------|--------|-------------|
| **P1** | `product/p1-operator-console` | Detail panel, inline runbook, shift toolbar, keyboard nav, explicit brief |
| **P2** | `product/p2-triage-state` | Ack / investigating / escalated per deployment (localStorage + UI) |
| **P3** | `product/p3-shift-handoff` | Shift notes + export brief bundle for handoff |
| **P4** | `product/p4-command-palette` | Ctrl+K palette, pinned deployments, filter polish, about copy |
| **P5** | `product/p5-sla-urgency` | SLA urgency bands, overdue alert strip, queue refresh, pipeline filters, fleet drill-down |
| **P6** | `product/p6-incident-workspace` | Runbook checklist, quick slip scenarios, copy deploy link |

## P6 acceptance

- [ ] `GET /api/scenario?deployment_id=&slip_weeks=` → `ScenarioResult` via `OpsContext.runInterconnectionSlip`
- [ ] `lib/runbook-checks.ts` — per-deployment step checkmarks in `goc-runbook-checks`; tested
- [ ] **DeploymentDetail** — checkable runbook steps; quick scenario chips (+2w / +4w); inline scenario result panel
- [ ] **Copy link** button — copies `window.location.origin/?deploy=ID` (or with tranche)
- [ ] `npm run build` + `npm test` green · `gt submit` → PR

## P5 acceptance

- [ ] `lib/sla-urgency.ts` — bands: overdue / critical (≤7d) / warning (≤14d) / ok; tested
- [ ] `SlaCountdown` component — shared urgency styling in console queue + detail + pipeline
- [ ] **Overdue alert strip** in header area when overdue count > 0 — click applies Overdue filter
- [ ] **Queue auto-refresh** every 5 min (silent refetch `/api/deployments`, preserve selection)
- [ ] **Pipeline** — filter chips All | Overdue | Due ≤14d; default sort soonest deadline first
- [ ] **Fleet** — stressed tranche rows link to console with exceptions list (`/?tranche=` query or exception links from `/api/deployments`)
- [ ] `npm run build` + `npm test` green · `gt submit` → PR

## P4 acceptance

- [ ] **Command palette** — `Ctrl+K` / `Cmd+K` overlay: search deployments by id/name/site, jump to select, run shift actions
- [ ] **Pinned watch list** — pin icon on queue rows; `localStorage` `goc-pins`; pinned items stay at top
- [ ] Filter change auto-selects first visible queue item
- [ ] Mobile: shortcuts `?` button visible (not keyboard-only)
- [ ] About page: operator product copy (no "playbook"/interview language)
- [ ] `npm run build` + `npm test` green
- [ ] `gt submit` → PR for review

## P1 acceptance

- [ ] Queue select shows **deployment detail + runbook** without auto-brief
- [ ] "Generate brief" is explicit action (button or command)
- [ ] Interview playbook → **Shift actions** (operator labels)
- [ ] Header: shift clock or ops mode, not `demo`
- [ ] Keyboard: `j`/`k` queue, `/` focus command, `?` shortcuts overlay
- [ ] Filter: All / Exception / Watch / Overdue
- [ ] `GET /api/deployment/[id]` — deployment + contract + runbook + risk row
- [ ] `npm run build` + `npm test` green
- [ ] `gt submit` → Graphite PR for review

## Graphite workflow

```powershell
cd c:\WAVSVN\components\_cartographer
git checkout main; gt sync
gt create product/pN-... -m "product(pN): ..."
# implement, commit
gt submit --no-edit
```

Reviewer reacts to Graphite/GitHub review comments in follow-up commits on same branch.
