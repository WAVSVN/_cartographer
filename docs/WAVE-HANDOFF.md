# WAVE HANDOFF

| active_role | REVIEWER |
| wave | P8 |
| branch | product/p8-workbench-layout |
| goal | Stop looking like AI dashboard — workbench layout |
| sha | ea51ec8 |
| pr | https://github.com/WAVSVN/_cartographer/pull/10 |

## REVIEWER — P8 workbench

PR: https://github.com/WAVSVN/_cartographer/pull/10 · SHA `ea51ec8`

Verify against `docs/DESIGN.md` Workbench + PRODUCT-ROADMAP P8 acceptance:

1. **OpsConsole** — full-bleed grid; queue = dense table (pin, #, ID, status, risk, SLA, name); no RiskBar in rows; segmented text filters; selected row = left border accent only
2. **DeploymentDetail** — borderless sections (`border-b`), no Panel wrapper; triage/runbook/scenarios/copy link intact
3. **BriefDock** — bottom collapsible dock (~40vh max) when brief exists; not stacked with handoff/actions
4. **ConsoleToolbar** — Handoff popover, Digest, Actions dropdown; shift notes + export moved out of scroll stack
5. **layout.tsx** — system-ui fonts (no IBM Plex); solid header; FleetKpis inline in header row
6. **Nav** — underline active tab
7. **Theme** — `rounded-ops` 3px; deployment IDs `ops-text` not amber; amber reserved for alarms
8. **Fleet/Pipeline** — full width; table-first; segmented filters on pipeline

Build/test: `npm run build && npm test` green on branch.

## BUILDER notes (done)

- New: `BriefDock.tsx`, `ConsoleToolbar.tsx`, `FleetKpis.tsx`
- `FleetHealthStrip` re-exports `FleetKpis` for compat
- `ShiftHandoffPanel.tsx` left in tree (unused by console; logic inlined in toolbar)
