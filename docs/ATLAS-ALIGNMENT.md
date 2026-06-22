# Atlas AI role — how Grid Ops Command maps

Interview cheat sheet for the Atlas AI posting. Live demo: https://cartographer-phi.vercel.app

## REST APIs → Azure (what transfers)

**The contract is the same.** Whether the handler runs in Next.js on Vercel or in Azure, the operator (or Copilot agent) sees HTTP + JSON.

| Today (cartographer) | Azure production analogue |
|----------------------|---------------------------|
| `GET /api/deployments` | Azure Function HTTP trigger → CRM/telemetry adapter |
| `GET /api/deployment/[id]` | Same function or API Management route → composite read |
| `POST /api/brief` | Function or Container App → tool planner + optional OpenAI |
| `GET /api/integrations/graph` | Function with managed identity → **Microsoft Graph REST** |
| MCP `cartographer-mcp` | Same tools behind Copilot Studio / custom agent host |

**Microsoft Graph is REST.** OAuth token + `GET https://graph.microsoft.com/v1.0/...` + JSON. Our `lib/integrations/azure-graph.ts` adapter uses fixture data by default; set `AZURE_GRAPH_TOKEN` + `AZURE_GRAPH_MODE=live` to hit calendar view for real.

**What you already know transfers directly:**

- Route design (`/api/resource`, query params, POST bodies)
- Zod validation at the boundary
- Error codes (400/502)
- Idempotent reads vs state-changing POSTs
- Auth as a header (`Authorization: Bearer`) — in Azure that's managed identity or app registration instead of env var

**What changes in Azure:** hosting (Functions/App Service), secrets (Key Vault), identity (Entra ID), observability (App Insights), and the backing data plane (Graph, SharePoint, SCADA webhook) — not the REST shape.

## Responsibilities coverage

| Posting bullet | In this repo | Artifact |
|----------------|--------------|----------|
| AI apps, MCP, workflow automation | Tool-grounded briefs, query planner, MCP server, triage/runbook/scenario workflows | `packages/mcp`, `POST /api/brief`, ops console |
| Connect to internal systems | HTTP + MCP tool surface; Graph adapter stub | `app/api/*`, `lib/integrations/azure-graph.ts` |
| AI testing / eval | Golden query regression + `validateBrief` gate before LLM merge | `packages/core/tests/brief-evals.test.ts`, `validate-brief.ts` |
| Auth, audit, data protection | Client shift audit log; citation-required briefs; Zod boundaries | `lib/audit-log.ts`, handoff export, schemas |
| Responsible AI / governance | Deterministic default; LLM only when keyed + validation passes | `lib/llm-brief.ts`, `mode` on brief API |
| Monitor / improve | Vercel deploy, vitest per wave, phased reviews | `docs/reviews/`, `npm test` |

## Demo script (60s, Atlas-flavored)

1. Open shift console — risk-ranked queue (fixture fleet).
2. Select **BRG-2047** — runbook, triage, scenario +4w slip.
3. Toolbar → **audit** — triage/runbook/scenario actions logged.
4. **Ctrl+K** → jump site; run ops summary (citations in brief).
5. **Handoff** → export markdown bundle includes audit section.
6. Optional: `GET /api/integrations/graph` — Graph-shaped calendar/mail/Teams signals.

## Talk track for gaps

| Gap | Honest line | Next build |
|-----|-------------|------------|
| No live Atlas CRM/SCADA | "Fixture ports with the same Zod schemas we'd use against real feeds." | Webhook ingest (P11) |
| Graph/Teams not wired in UI | "Adapter + route exist; UI surfacing is one panel away." | Shift sidebar for Graph signals |
| No Entra auth on app | "Boundary validation today; Entra middleware is a route wrapper." | `middleware.ts` + app registration |
| LLM optional | "Planner default; OpenAI only when `OPENAI_API_KEY` set and output passes `validateBrief`." | Expand golden set for LLM mode |

## Env reference

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Enable LLM brief synthesis (`lib/llm-brief.ts`) |
| `OPENAI_MODEL` | Model id (default `gpt-4o-mini`) |
| `AZURE_GRAPH_TOKEN` | Bearer token for live Graph calendar read |
| `AZURE_GRAPH_MODE` | Set to `live` with token above |

## Run evals locally

```powershell
cd components\_cartographer
npm test
```

Golden brief cases: `packages/core/tests/brief-evals.test.ts`
