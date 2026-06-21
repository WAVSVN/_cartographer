# REBUILD-SPEC — Grid Ops Command → _cartographer

**Source prototype:** `WAVSVN/components/grid-ops-brief/site`  
**Target repo:** https://github.com/WAVSVN/_cartographer (`rebuild/v1`)

## Global acceptance (v1)

- [ ] `npm run build` passes at repo root
- [ ] `npm test` passes
- [ ] API responses match prototype shape (see below)
- [ ] UI routes `/`, `/fleet`, `/pipeline`, `/about` render with fixture data
- [ ] Deployed to Vercel under WAVSVN account

## Wave 2 — API parity (`apps/web`)

Thin Next.js 15 App Router. **No business logic in routes** — only `@cartographer/core` + `@cartographer/data`.

| Route | Method | Response shape (match prototype) |
|-------|--------|----------------------------------|
| `/api/deployments` | GET | `{ tools, deployments, exceptions, risk_ranked }` |
| `/api/fleet` | GET | `FleetSummary` |
| `/api/pipeline` | GET | `{ pipeline: PipelineItem[] }` |
| `/api/digest` | GET | `{ ...MorningDigest, validation: { ok, errors } }` |
| `/api/brief` | POST | `BriefResponse` body `{ query }` — 400 if missing |

**Singleton:** `lib/ops.ts` — `loadFixtureBundle()` + `new OpsContext(bundle)` once per process.

**Workspace:** add `apps/*` to root `package.json` workspaces.

**Done when:** all five routes return 200 with validated JSON; `npm run build` includes `apps/web`.

## Wave 3 — UI parity

Port pages from prototype: Ops console, fleet, pipeline, about. Tailwind. Fetch from local API routes.

**Done when:** visual parity ~8/10 vs prototype; mobile pipeline cards work.

## Wave 4 — MCP (optional)

`packages/mcp` stdio server exposing `TOOL_SCHEMAS` + `callTool`.

## Wave 5 — Deploy + PR

- Vercel project under WAVSVN
- Open PR `rebuild/v1` → `main` with test plan
