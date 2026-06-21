# GOC design — anti-slop

Industrial control-room UI, not generic AI dashboard.

## Avoid

- Grid/dot backgrounds on body
- Amber accent on everything (reserve for alarms)
- `uppercase tracking-widest` section headers
- VALID / INVALID badges when validation passed
- Monospace on labels (mono = IDs, numbers, timestamps only)
- Inset panel glows / heavy shadows
- Terminal `>` prompt in inputs
- SaaS copy: unlock, elevate, seamlessly, "Generating…" theater
- Badge soup (severity + valid + status all in one row)

## Do

- Flat panels, 1px borders, quiet hierarchy
- Sentence-case section labels (`text-xs font-medium text-ops-muted`)
- Severity = left border accent on brief card
- Domain words: digest, triage, handoff, runbook, slip
- Errors only when something failed
- Steel-blue (`ops-link`) for navigation; amber/red for warn/alarm
- Information density over decorative chrome

## Workbench (P8+)

Escape the **sidebar cards + stacked panels** dashboard pattern:

- Full-bleed console (no `max-w-7xl` on ops view)
- Queue = dense **table rows**, not bordered card list; no `RiskBar` per row
- Work area = borderless detail (dividers only), not nested `ops-panel` stacks
- Brief = bottom dock or collapsible strip, not another panel in the scroll stack
- Shift handoff / actions → toolbar or palette, not two more panels above brief
- System font stack (drop Google font pairing) unless one distinctive face is justified
- Header = one row: title, nav, KPIs, clock — no backdrop-blur SaaS chrome
- Filter = text segmented control, not mono pill chips
- ID color = text primary, not accent amber

Reference: `WAVSVN/components/no-slop/rules.json` → `ui_avoid_rules`
