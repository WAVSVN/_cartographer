# Grid Ops Command — pitch

## One line

**Shift workbench for private-grid deployments** — triage exceptions, run runbooks, model SLA slips, export handoff. Citations on every brief.

## What it actually does

Operators sit on a **risk-ranked queue** of bridge/permanent sites. For each deployment they get:

1. **Facts** — MW gap, contract SLA, equipment, commissioning deadline
2. **Runbook** — exception steps with checkboxes (shift-local progress)
3. **Triage state** — ack → investigating → escalated → cleared
4. **Scenarios** — “if interconnection slips +4w, who breaches SLA?” without a chat UI
5. **Handoff** — markdown export: fleet health, open exceptions, triage notes, session briefs

Fleet and pipeline pages are **roll-up views** that drill into the console (`/?deploy=`, `/?tranche=`). The brief engine is **deterministic + validated** (citations required) — shaped for governed AI later, not chat-first today.

## What it is NOT

- Not a BI/roadmap dashboard for executives
- Not a chatbot product (query bar is a power feature)
- Not connected to live SCADA/CRM yet (fixture data, production-shaped API)

## 60-second demo script

1. Open console — digest loads; queue ranked by risk
2. Click **BRG-2047** — detail + runbook, no auto-brief
3. Set triage **Investigating**, tick a runbook step
4. Hit **+4w slip** — inline SLA impact
5. Toolbar → **Handoff** → export markdown for next shift
6. Optional: `Ctrl+K` → jump site; fleet tranche link

## Who cares

| Persona | Hook |
|---------|------|
| **Shift operator** | One screen: queue, runbook, SLA clock, triage |
| **Handoff lead** | Exportable shift bundle, audit of briefs |
| **Platform / AI team** | Same tools via HTTP + MCP; Zod boundaries; citation validation |

## Atlas / private-grid angle

> “We run bridge-to-permanent deployments under GFA tranches. Exceptions hit a ranked queue with runbooks and SLA clocks — not another roadmap slide. Briefs are citation-backed and tool-traced; the MCP server exposes the same ops tools we’d wire to CRM and telemetry.”

## Recommended next builds (priority)

| Priority | Wave | Why |
|----------|------|-----|
| 1 | **P9 — Shift onboarding** | First-run overlay: “start shift” in 3 steps (digest → top exception → handoff). Fixes “what do I do here?” |
| 2 | **P10 — Action audit log** | Timestamped log: triage changes, runbook checks, briefs run. Export with handoff. **Governance story** for AI role. |
| 3 | **P11 — Simulated ingest** | One webhook/cron nudges fixture status (watch→exception). Console feels alive without real SCADA. |
| 4 | **P12 — Role presets** | Operator / fleet / handoff default filters and layout — same app, different entry |
| 5 | **P13 — Live LLM brief** | Optional layer on validated tool trace; keep deterministic default |

Stop building more chrome until **P9 + P10** land — they answer pitch and “why AI governance matters.”
