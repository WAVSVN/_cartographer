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
