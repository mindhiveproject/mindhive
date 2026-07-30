# MindHive Frontend
---
Next.js 13 (Pages Router) app for [mindhive.science](https://mindhive.science). It talks to the KeystoneJS backend (`../keystone`, GraphQL on port 4444) and the realtime collaboration server (Hocuspocus, port 4445). There is **no custom server** — the app runs with the standard `next dev` / `next start`.

## Prerequisites
---
- Node 26 (backend runs on Node 23 — see `../.vscode/tasks.json`)
- The Keystone backend running on `http://localhost:4444` (see `../keystone`)
- Optionally the collab server on `http://localhost:4445` (needed for proposal/board editing)

## Setup
---
```bash
npm install --legacy-peer-deps
```

Environment variables are optional in dev — everything defaults to the local ports above. To customize, copy the template and edit:

```bash
cp .env.example .env
```

All endpoint configuration lives in [`config.js`](config.js), which resolves each value from environment variables with dev/prod defaults. Don't hardcode backend URLs anywhere else — import from `config.js`.

## Development
---
```bash
npm run dev        # http://localhost:3000
```

Hot reload covers pages, components, and the API routes in `pages/api/`. In dev, `/api/graphql` is proxied to Keystone via a rewrite in `next.config.js`, so the browser talks same-origin.

## Production
---
```bash
npm run build      # compiles (SWC) + type-checks
npm run start      # serves on port 3000
```

Notes for the VM deploy:

- **Deploy the backend first** when a release includes Keystone schema changes (run `npm run migrate` in `../keystone`); the frontend queries new fields on boot.
- Run the frontend from this directory (relative paths for `data/` and `templates/` depend on the working directory), single instance / pm2 fork mode (the in-memory rate limiter assumes one process):
  ```bash
  pm2 start npm --name mindhive-frontend -- start
  ```
- nginx must forward `X-Forwarded-For` (rate limiting keys on it) and sits in front of port 3000.
- `NEXT_PUBLIC_*` env values are baked in at **build** time — rebuild after changing them.

## Scripts
---
| Script | What it does |
| --- | --- |
| `npm run dev` | Next dev server on port 3000 |
| `npm run build` | Production build (4GB heap; copies Monaco assets first) |
| `npm run start` | Production server on port 3000 |
| `npm run lint` / `lint:fix` | ESLint |

## Layout
---
- `pages/` — routes (Pages Router); `pages/api/` holds the server routes:
  - `api/save` — participant experiment data → `data/YYYY/MM/DD/…` + SummaryResult mutation to Keystone
  - `api/templates/*` — task template files on disk (`templates/`)
  - `api/notion` — Notion database proxy (needs `NOTION_KEY`)
  - `api/download/rawfiles`, `api/data/...` — study data retrieval
- `components/` — React components (Builder, Dashboard, Connect, TipTap, …)
- `lib/` — Apollo client (`withData.js`), shared API-route helpers (`lib/api/`)
- `config.js` — endpoint resolution (env-driven, single source of truth)

TypeScript is enabled incrementally (`tsconfig.json`, `allowJs`): new code can be `.ts`/`.tsx`, existing `.js` files migrate opportunistically. `next build` type-checks the TS files.
