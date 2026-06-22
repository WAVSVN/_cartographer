# GOC design — Lucid Obscura + anti-slop

Industrial shift console in **Lucid Obscura** palette — pure black, acid red accent, scanline wash, monospace throughout. Reference: `components/_cartographer/interview-atlas.html`.

## Lucid Obscura tokens

| Token | Value | Use |
|-------|-------|-----|
| `ops-bg` | `#000` | Page background |
| `ops-link` / `ops-critical` | `#ff0033` | Accent, alarms, active nav, selection |
| `ops-text` | `#e8e8e8` | Body |
| `ops-muted` | `#666` | Secondary chrome |
| `ops-muted-bright` | `#a3a3a3` | Warnings, medium severity |
| `ops-line` | `rgba(255,255,255,0.08)` | Borders |
| `ops-line-hover` | `rgba(255,0,51,0.35)` | Hover borders, investigating triage |
| `ops-teal` / `ops-teal-dim` | `#659296` / `#355665` | lockeddoor subs, ghost buttons |
| `ops-teal-hover` | `#9bb7c4` | Inputs focused, secondary links |
| `ops-green` | `#1eff00` | lockeddoor nav/button hover |
| `ops-chrome` | `#d8d9d8` | Default nav + queue ID text |
| `ops-tree-line` | `#4a6a72` | Queue table rules |

- **lockeddoor** layer: door gif in header (`BrandMark`), `\` nav prefix (`.ld-backslash`), epigraph in tagline, green hover on chrome controls, acid red for active/alarm
- `borderRadius.ops` = `0` — square corners everywhere
- Scanline overlay on `body::before` (35% opacity)
- Section labels: `.lo-side-label` — lowercase, wide tracking, bottom rule
- Chrome copy: lowercase (`grid ops command`, nav: `console`, `fleet`, …)

## Avoid

- Grid/dot backgrounds on body
- Amber/yellow accent on everything (reserve acid red for alarms + active state)
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
- Steel-blue or SaaS purple accents — use `ops-link` acid red only
- Information density over decorative chrome

## Workbench (P8+)

Escape the **sidebar cards + stacked panels** dashboard pattern:

- Full-bleed console (no `max-w-7xl` on ops view)
- Queue = dense **table rows**, not bordered card list; no `RiskBar` per row
- Work area = borderless detail (dividers only), not nested `ops-panel` stacks
- Brief = bottom dock or collapsible strip, not another panel in the scroll stack
- Shift handoff / actions → toolbar or palette, not two more panels above brief
- System font stack unless LO pairing (Fira Code + Share Tech Mono) is intentional
- Header = sticky black bar, thin rule, optional backdrop-blur — no heavy shadow
- Filter = text segmented control, not mono pill chips
- ID color = text primary, not accent amber

Reference: `WAVSVN/components/no-slop/rules.json` → `ui_avoid_rules`
