# Cloudflare Deployment Guide

## Architecture Overview

```
Request
   │
   ▼
workers/app.ts          ← Cloudflare Worker entry point
   │  creates PrismaClient with D1 adapter (per request)
   │  injects { db, cloudflare: { env, ctx } } into context
   │
   ▼
React Router v7         ← handles routing, SSR
   │
   ├── loaders/actions  ← use context.db for all DB access
   │     │
   │     └── auth.server.ts  ← session + password logic (receives db via context)
   │
   └── UI components    ← shadcn/ui + Tailwind CSS v4

Cloudflare D1           ← SQLite database (managed by Cloudflare)
```

### Key design decisions

- **Per-request DB connection** — `workers/app.ts` creates a `PrismaClient` with the D1 adapter on every request and disconnects on completion. No global singleton.
- **`db` via context** — all loaders/actions access the database through `context.db`, not a module-level import.
- **Web Crypto PBKDF2** — passwords are hashed with the native `crypto.subtle` API instead of `bcryptjs`, which is not compatible with the Cloudflare Workers runtime.
- **Lazy session storage** — `session.server.ts` initializes on first use so `SESSION_SECRET` (injected by the Worker at request time) is available before the session storage is created.

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

Copy the `database_id` from the output and paste it into `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "travel-journal-db"
database_id = "paste-the-id-here"
```

### 3. Apply the database schema and seed data

Prisma stores migrations under `prisma/migrations/<timestamp>/migration.sql`. **Wrangler only runs `.sql` files that sit directly** in `migrations_dir` (see `wrangler.toml`), so this project keeps a copy for D1 under `d1/migrations/` (e.g. `0001_initial.sql`). After you change the schema with Prisma, copy or regenerate that SQL into a new numbered file under `d1/migrations/` before applying remotely.

```bash
# Local: create/update Prisma migrations (SQLite file in prisma.config.ts)
npx prisma migrate dev

# Remote D1: apply schema (uses d1/migrations/*.sql)
npm run db:migrate:remote
# or: npx wrangler d1 migrations apply travel-journal-db --remote
```

`npm run db:seed` and `prisma db seed` only target **local** SQLite (`dev.db` or Miniflare’s file under `.wrangler/state/…`). They do **not** populate Cloudflare D1.

To load the same demo data on production D1:

```bash
npm run db:seed:remote:generate   # optional: rewrite d1/seed.sql from scripts/generate-d1-seed.mjs
npm run db:seed:remote           # INSERT demo user + trips (login: test@user.com / Password123!)
```

### 4. Set secrets

```bash
# Required — signs the session cookie
# Use any long random string, e.g.: openssl rand -base64 32
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
| `SESSION_SECRET` | Signs the session cookie. Any long random string. | `wrangler secret put SESSION_SECRET` |
| `DB` (D1 binding) | Set in `wrangler.toml`, not a secret — just the `database_id` from step 2. | Edit `wrangler.toml` |

### Optional (Google OAuth)

Only needed if you want Google login. Get these from [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials.

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

### Dev commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server at `http://localhost:5173` (Vite + Cloudflare proxy) |
| `npm run preview` | Run the built Worker locally via Wrangler at `http://localhost:8787` |

### First-time local setup

**1. Add `.dev.vars`** (gitignored — already created):
```bash
# .dev.vars
SESSION_SECRET=any-local-dev-secret
```

**2. Apply the schema to the local D1 emulation:**

> `wrangler d1 migrations apply` sometimes doesn't detect new migrations correctly.
> If your tables are missing, apply the SQL directly:

```bash
npx wrangler d1 migrations apply travel-journal-db --local
# or apply the same SQL Wrangler uses for remote:
npx wrangler d1 execute travel-journal-db --local --file d1/migrations/0001_initial.sql
```

**3. Seed with test data:**

```bash
npm run db:seed
```

The seed auto-detects the Miniflare D1 file in `.wrangler/state/` and populates it.

**Test credentials after seeding:**
- Email: `test@user.com`
- Password: `Password123!`

### After a schema change (local)

```bash
npx prisma migrate dev
# Copy the new prisma/migrations/<timestamp>_<name>/migration.sql to d1/migrations/0002_<name>.sql (next number), then:
npx wrangler d1 migrations apply travel-journal-db --local
```

---

## Subsequent Deploys

One-shot pipeline (remote D1 migrations, remote seed, build, deploy):

```bash
npm run deploy:cloudflare
```

Or step by step:

```bash
npm run build
npx wrangler deploy
```

If the Prisma schema changed:

```bash
npx prisma migrate dev
# Add d1/migrations/00NN_<name>.sql from the new Prisma migration folder, then:
npm run db:migrate:remote
npm run build && npx wrangler deploy
```
