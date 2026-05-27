# Cloudflare Deployment Guide

## Architecture Overview

```
Request
   │
   ▼
workers/app.ts          ← Cloudflare Worker entry point
   │  creates repositories from env.DB (per request)
   │  injects { repos, cloudflare: { env, ctx } } into context
   │
   ▼
React Router v7         ← handles routing, SSR
   │
   ├── loaders/actions  ← use context.repos for all DB access
   │     │
   │     └── auth.server.ts  ← session + password logic
   │
   └── UI components    ← shadcn/ui + Tailwind CSS v4

Cloudflare D1           ← SQLite database (managed by Cloudflare)
```

### Key design decisions

- **Repository pattern** — routes never call SQL directly; all DB consumption stays in `app/lib/repositories`.
- **`repos` via context** — loaders/actions access DB through `context.repos`, not module-level singletons.
- **Zod-validated DB rows** — repositories parse D1 rows with shared schemas in `app/lib/schemas`.
- **Web Crypto PBKDF2** — passwords use native `crypto.subtle`, compatible with Workers.
- **Lazy session storage** — `session.server.ts` initializes only after `SESSION_SECRET` is injected in the Worker.

---

## First-Time Deploy

### 1. Login to Cloudflare

```bash
npx wrangler login
```

### 2. Create the D1 database

```bash
npx wrangler d1 create travel-journal-db
```

Copy the `database_id` from the output into `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "travel-journal-db"
database_id = "paste-the-id-here"
```

### 3. Apply schema and seed data

This project uses Wrangler SQL migrations only (`d1/migrations/*.sql`).

```bash
# Local D1 (Miniflare)
npm run db:migrate
npm run db:seed

# Remote D1 (Cloudflare)
npm run db:migrate:remote
npm run db:seed:remote
```

Optional: regenerate demo seed SQL before remote seeding:

```bash
npm run db:seed:remote:generate
```

### 4. Set secrets

```bash
# Required
npx wrangler secret put SESSION_SECRET
```

### 5. Build and deploy

```bash
npm run build
npx wrangler deploy
```

---

## Secrets Reference

### Required

| Secret | Description | How to set |
|---|---|---|
| `SESSION_SECRET` | Signs the session cookie. Use a long random string. | `wrangler secret put SESSION_SECRET` |
| `DB` (D1 binding) | Set in `wrangler.toml` via `database_id`. | Edit `wrangler.toml` |

### Optional (Google OAuth)

Only needed if you enable Google login:

| Secret | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Client Secret |
| `GOOGLE_REDIRECT_URI` | `https://your-worker.workers.dev/auth/google/callback` |

```bash
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put GOOGLE_REDIRECT_URI
```

---

## Local Development

### Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server (`http://localhost:5173`) |
| `npm run preview` | Run built Worker locally (`http://localhost:8787`) |
| `npm run db:migrate` | Apply local D1 migrations |
| `npm run db:seed` | Seed local D1 from `d1/seed.sql` |

### First-time local setup

1) Add `.dev.vars`:

```bash
SESSION_SECRET=any-local-dev-secret
```

2) Apply migrations and seed:

```bash
npm run db:migrate
npm run db:seed
```

Test credentials:
- Email: `test@user.com`
- Password: `Password123!`

### After schema changes

Create a new numbered SQL migration under `d1/migrations/`, then:

```bash
npm run db:migrate
npm run db:migrate:remote
```

---

## Subsequent Deploys

One-shot pipeline:

```bash
npm run deploy:cloudflare
```
