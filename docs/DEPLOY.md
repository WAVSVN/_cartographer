# Deploy — Cartographer (`apps/web`)

**Production:** https://cartographer-wavsvns-projects.vercel.app  
**Vercel project:** `wavsvns-projects/cartographer`  
**Git branch:** `rebuild/v1`

## Monorepo (npm workspaces)

Vercel **Root Directory** is `apps/web` with **Include source files outside Root Directory** enabled so workspace packages (`@cartographer/core`, `@cartographer/data`, `@cartographer/schemas`) resolve from the repo root.

`apps/web/vercel.json`:

```json
{
  "installCommand": "cd ../.. && npm install",
  "buildCommand": "cd ../.. && npm run build",
  "framework": "nextjs"
}
```

## First-time setup (WAVSVN account)

```powershell
cd components\_cartographer\apps\web
npx vercel login          # sign in as wavsvn
npx vercel link --yes --project cartographer
npx vercel git connect https://github.com/WAVSVN/_cartographer
```

Set production branch to `rebuild/v1` (or `main` after merge) in Vercel → Project → Settings → Git.

## Deploy

**Git (preferred):** push to `rebuild/v1` — Vercel auto-builds.

```powershell
cd components\_cartographer
git push origin rebuild/v1
```

**CLI (preview):** from `apps/web` after `vercel link`:

```powershell
npx vercel --prod --yes --scope wavsvns-projects
```

> CLI uploads only `apps/web` unless Git is used; use Git deploy for monorepo builds.

## Verify

```powershell
$base = "https://cartographer-wavsvns-projects.vercel.app"
@("/", "/fleet", "/pipeline", "/about", "/api/fleet", "/api/pipeline", "/api/deployments", "/api/digest") | ForEach-Object {
  (Invoke-WebRequest -Uri "$base$_" -UseBasicParsing).StatusCode
}
```

`POST /api/brief` with body `{"query":"status"}` should return 200.

## Local

```powershell
cd components\_cartographer
npm install
npm run build
npm run dev -w @cartographer/web
```
