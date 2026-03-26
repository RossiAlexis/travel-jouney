# Cloudflare Workers — Architecture & Key Concepts

## The Old Mental Model (Node.js server)

In a traditional Node.js app, you have a **long-running process**:

```
Your server starts
    │
    ├── connects to database (once, keeps connection open)
    ├── loads config, env vars (once)
    └── waits for requests...
         │
         ├── Request 1 → handles it → responds
         ├── Request 2 → handles it → responds
         └── Request 3 → handles it → responds
```

The server is always "on", sitting in memory, with a persistent database connection.
This is what the app used before with PostgreSQL.

---

## The New Mental Model (Cloudflare Workers)

Cloudflare Workers are completely different. There is **no persistent process**. Instead:

```
Request arrives at Cloudflare's edge
    │
    ├── Worker "wakes up" (V8 isolate spins up)
    ├── runs your fetch() handler
    ├── responds
    └── Worker may be destroyed (or kept warm briefly)
```

Think of it like a **function that runs on demand**, not a server that's always running.
This is called **serverless** or **edge computing**.

### Why "edge"?

Cloudflare has ~300 data centers worldwide. When a user in Tokyo makes a request,
it hits a Tokyo data center — not a server in Virginia. Your code literally runs
geographically close to the user. That's the "edge."

---

## Key Components

### 1. The Worker (`workers/app.ts`)

This is the **entry point** — the code Cloudflare actually runs for every request.

```typescript
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // This runs for EVERY request
  }
}
```

Three things come in automatically:

| Parameter | What it is |
|---|---|
| `request` | The HTTP request (URL, headers, body, method) |
| `env` | Your secrets and bindings (DB, SESSION_SECRET, etc.) |
| `ctx` | Execution context — used for `waitUntil()` to run code after the response is sent |

---

### 2. D1 (the database)

D1 is Cloudflare's managed SQLite database.

- **SQLite** is a file-based database — no separate server process, no connection strings
- **Cloudflare hosts it** — you don't manage any infrastructure
- **It's a "binding"** — your Worker accesses it through `env.DB`, not a URL
- The binding is declared in `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"                    # how you reference it in code: env.DB
database_name = "travel-journal-db"
database_id = "abc-123"           # which D1 database on Cloudflare
```

---

### 3. Prisma + D1 Adapter

Prisma is the **ORM** (Object Relational Mapper) — it lets you write TypeScript instead of raw SQL:

```typescript
// Instead of: SELECT * FROM trips WHERE userId = '123'
const trips = await db.trip.findMany({ where: { userId: '123' } })
```

The **D1 adapter** (`@prisma/adapter-d1`) is the bridge between Prisma and D1.
Because Workers don't use traditional database connections, Prisma can't work normally —
the adapter translates Prisma queries into D1's API.

```typescript
// In workers/app.ts — runs on every request
const adapter = new PrismaD1(env.DB)      // bridge: Prisma → D1
const db = new PrismaClient({ adapter })  // Prisma client backed by D1
```

---

### 4. `wrangler.toml`

Your **Cloudflare configuration file** — like a `package.json` but for Workers:

```toml
name = "travel-journal"         # worker name on Cloudflare
main = "workers/app.ts"         # entry point
compatibility_date = "..."      # which Workers runtime version
compatibility_flags = ["nodejs_compat"]  # enables Node.js APIs in Workers

[[d1_databases]]                # database binding
binding = "DB"
database_name = "travel-journal-db"
database_id = "..."

[vars]                          # non-secret env vars (safe to commit)
NODE_ENV = "production"
```

---

### 5. AppLoadContext — how `db` reaches your pages

React Router v7 supports a "load context" — data passed from the Worker into every
loader and action. This is how `context.db` ends up available in your pages
without importing anything directly.

```
workers/app.ts
  creates db
  passes it to React Router as context
      │
      ▼
  loader({ context }) {
    context.db.trip.findMany(...)  ← available here
  }
```

The type declaration in `workers/app.ts` tells TypeScript what's inside context:

```typescript
declare module "react-router" {
  interface AppLoadContext {
    db: PrismaClient
    cloudflare: { env: CloudflareEnv, ctx: ExecutionContext }
  }
}
```

---

### 6. Secrets vs Vars

Two types of configuration in Workers:

| Type | Example | Stored in | How to set |
|---|---|---|---|
| **Vars** | `NODE_ENV=production` | `wrangler.toml` (committed to git) | Edit `wrangler.toml` |
| **Secrets** | `SESSION_SECRET=abc123` | Cloudflare's encrypted vault (never in git) | `wrangler secret put NAME` |

Secrets are **encrypted at rest** and only decrypted inside your Worker at runtime.
They never appear in your code, git history, or logs.

For local dev, both live in `.dev.vars` (gitignored):

```bash
# .dev.vars
SESSION_SECRET=any-local-dev-secret
```

---

## Request Lifecycle (end to end)

Here's what happens when a user visits `/dashboard`:

```
1. User's browser sends GET /dashboard
        │
2. Hits nearest Cloudflare data center (~300 worldwide)
        │
3. workers/app.ts fetch() runs:
   - injects SESSION_SECRET into process.env
   - creates PrismaD1 adapter with env.DB
   - creates PrismaClient (per-request)
   - calls React Router's requestHandler
        │
4. React Router matches route → dashboard.tsx
        │
5. loader({ request, context }) runs:
   - requireAuth(context.db, request)
     → reads session cookie
     → looks up user in D1
   - context.db.trip.findMany(...)
     → queries D1 for trips
        │
6. React Router renders the page HTML (server-side)
        │
7. Response sent back to user's browser
        │
8. ctx.waitUntil(db.$disconnect()) runs after response
   → cleans up DB connection in the background
```

---

## Local Dev vs Production

| | Local (`wrangler dev`) | Production (`wrangler deploy`) |
|---|---|---|
| Runtime | Wrangler emulates Workers locally | Cloudflare's actual V8 isolates |
| Database | Local SQLite file (emulated D1) | Cloudflare D1 |
| Secrets | `.dev.vars` file | `wrangler secret put` |
| URL | `http://localhost:8787` | `https://travel-journal.workers.dev` |

---

## Before vs After

| | Before (PostgreSQL + Node.js) | Now (Cloudflare Workers + D1) |
|---|---|---|
| Server | Always running, self-managed | Serverless, Cloudflare managed |
| Database | PostgreSQL (separate server) | D1 SQLite (Cloudflare managed) |
| DB connection | One persistent pool | New connection per request |
| Scaling | Manual configuration | Automatic |
| Deploy | Push code, restart process | `wrangler deploy` (seconds) |
| Cost | Pay for uptime | Pay per request (generous free tier) |

---

## The One Thing That Trips People Up

Because there's no persistent process, **you cannot store anything in memory between requests**.
No global variables that accumulate state, no in-memory caches that survive across requests.
Every request starts completely fresh.

This is why `db` is created per-request instead of once at startup — there is no
"startup" in the traditional sense.

For caching between requests, Cloudflare offers **KV** (key-value store) and the
**Cache API** — but those are topics for when you need them.
