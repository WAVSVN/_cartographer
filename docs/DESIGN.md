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

Reference: `WAVSVN/components/no-slop/rules.json` → `ui_avoid_rules`
