# WAVE HANDOFF

| active_role | BUILDER |
| wave | P8 |
| branch | product/p8-workbench-layout |
| goal | Stop looking like AI dashboard — workbench layout |

## BUILDER — P8 workbench

Read `docs/DESIGN.md` Workbench section + PRODUCT-ROADMAP P8.

Structural refactor, not just colors:

1. `OpsConsole` — full viewport workbench; queue table; remove RiskBar from rows; amber pills → segmented text filters
2. `DeploymentDetail` — unbox (no Panel wrapper)
3. Brief — `BriefDock` bottom collapsible OR fixed bottom area; don't stack with handoff/actions panels
4. `ShiftHandoffPanel` + shift actions → `ConsoleToolbar` in ops header row OR overflow menu
5. `layout.tsx` — system-ui fonts; inline KPIs; solid header
6. `Nav.tsx` — underline active tab
7. `tailwind.config.ts` + globals — tighter radius (3px), monochrome bias

Keep all behavior/tests working; update tests if selectors/copy change.

Ship: `product(p8): workbench layout — table queue, docked brief, borderless detail`
PR → REVIEWER
