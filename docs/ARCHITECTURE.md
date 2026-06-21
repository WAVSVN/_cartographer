# Architecture

## Principles

1. **Domain-first** — business logic in `@cartographer/core`; no React/Next imports in core.
2. **Zod at boundaries** — API inputs/outputs and fixture loading validated.
3. **Thin adapters** — Next.js routes call application services; UI is a client over HTTP.
4. **Test the core** — Vitest on risk, fleet, brief validation without a browser.
5. **Deployable slices** — each wave ships build + tests green.

## Layout (target)

```
_cartographer/
  apps/web/              Next.js 15 App Router (UI + API routes)
  packages/
    schemas/             Zod models + inferred TS types
    core/                Domain services, tools, brief engine
    data/                Synthetic fixtures (JSON)
  docs/                  AUDIT, REBUILD-SPEC, reviews
```

## Language choices

| Layer | Choice | Why |
|-------|--------|-----|
| Domain | TypeScript strict | Type-safe ops logic, easy to test |
| API/UI | Next.js 15 | Vercel deploy, same as prototype |
| Validation | Zod | Runtime guard at API + data load |
| Styling | Tailwind 3 | Matches prototype, fast iteration |
| Tests | Vitest | Native TS, fast unit tests |
| Future MCP | `packages/mcp` stdio | Same tool schemas as HTTP |

## Not in v1

- Live LLM (deterministic briefs first)
- Real SCADA/CRM connectors (fixture ports only)
