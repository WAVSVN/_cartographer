# _cartographer

Clean TypeScript rewrite of **Grid Ops Command** (private-grid operations intelligence).

- **Live:** https://cartographer-phi.vercel.app
- **Pitch:** [docs/PITCH.md](./docs/PITCH.md)
- **Atlas AI role map:** [docs/ATLAS-ALIGNMENT.md](./docs/ATLAS-ALIGNMENT.md)
- **MCP server:** [docs/MCP.md](./docs/MCP.md)
- **Source reference:** `WAVSVN/components/grid-ops-brief` (prototype)
- **Stack:** TypeScript strict, npm workspaces monorepo, Next.js 15, Zod, Vitest
- **Branch:** `rebuild/v1`

## Quick eval

```powershell
cd components\_cartographer
npm test
```

Golden brief regression: `packages/core/tests/brief-evals.test.ts`

## Integrations

| Route | Purpose |
|-------|---------|
| `POST /api/brief` | Tool-grounded ops summary (`mode`: planner / llm / auto) |
| `GET /api/integrations/graph` | Microsoft Graph adapter (fixture or live) |

See [ORCHESTRATION.md](./ORCHESTRATION.md) and [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) (wave 1+).
