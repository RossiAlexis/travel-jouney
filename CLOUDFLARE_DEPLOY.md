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

### 3. Apply the database schema

```bash
# Generate the SQLite migration
npx prisma migrate dev

# Apply to production D1
npx wrangler d1 migrations apply travel-journal-db
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
npx wrangler d1 execute travel-journal-db --local \
  --file prisma/migrations/<timestamp>_initial/migration.sql
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
npx prisma migrate dev                        # creates new migration SQL
npx wrangler d1 execute travel-journal-db \
  --local --file prisma/migrations/<new>/migration.sql
```

---

## Subsequent Deploys

```bash
npm run build
npx wrangler deploy
```

If the Prisma schema changed:

```bash
npx prisma migrate dev                                    # create migration
npx wrangler d1 migrations apply travel-journal-db        # apply to production
npm run build && npx wrangler deploy
```
