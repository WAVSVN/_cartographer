# WAVE HANDOFF

| Field | Value |
|-------|-------|
| active_role | BUILDER |
| wave | P7 |
| branch | product/p7-anti-slop-ui |
| goal | UI feels industrial, not AI slop |

## BUILDER — P7 anti-slop UI

Read `docs/DESIGN.md` + `components/no-slop/rules.json` ui_avoid_rules (in WAVSVN repo).

1. `gt create product/p7-anti-slop-ui` from main
2. Refresh `tailwind.config.ts` + `globals.css` per DESIGN.md
3. Add `SectionLabel` to ui.tsx; grep-replace uppercase section headers
4. Refactor BriefCard, FleetHealthStrip, layout header, OpsConsole command bar
5. Touch DeploymentDetail, ShiftHandoffPanel, ScenarioPanel, Pipeline/Fleet table headers
6. Do NOT break functionality or tests — update test strings if copy changes

Ship: `product(p7): anti-slop UI — industrial control room polish`
`gt submit` → REVIEWER
