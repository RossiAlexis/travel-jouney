# Deployment Skill — Cloudflare Workers + React Router v7

When working on deployment, configuration, or Cloudflare Workers setup, follow these rules.

---

## Required config files

### `react-router.config.ts`

Always include the `v8_viteEnvironmentApi` flag. Without it, the Workers module runner cannot load CJS packages (like React) and will throw `module is not defined`.

```ts
import type { Config } from "@react-router/dev/config";

export default {
  ssr: true,
  future: {
    v8_viteEnvironmentApi: true,
  },
} satisfies Config;
```

> **Never use** `unstable_viteEnvironmentApi` — it was renamed to `v8_viteEnvironmentApi` and throws a hard error.

---

### `vite.config.ts`

Keep it minimal. Do NOT add custom `environments`, `optimizeDeps`, or `resolve` blocks. They are not needed and interfere with the Cloudflare plugin.

```ts
import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
  ],
});
```

---

### `app/entry.server.tsx`

Always create this file explicitly. React Router's implicit default uses `renderToPipeableStream` (Node.js streams) which **does not exist** in the Workers runtime.

Use `renderToReadableStream` (Web Streams API) instead:

```tsx
import type { AppLoadContext, EntryContext } from "react-router";
import { ServerRouter } from "react-router";
import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: AppLoadContext
) {
  let shellRendered = false;

  const body = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      onError(error: unknown) {
        responseStatusCode = 500;
        if (shellRendered) {
          console.error(error);
        }
      },
    }
  );
  shellRendered = true;

  if ((isbot(request.headers.get("user-agent") ?? "")) || routerContext.isSpaMode) {
    await body.allReady;
  }

  responseHeaders.set("Content-Type", "text/html");
  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
```

---

### `workers/app.ts`

The Worker entry point. Instantiate PrismaClient per-request (Workers are stateless — no persistent process).

```ts
import { createRequestHandler } from "react-router";
import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";

interface CloudflareEnv {
  DB: D1Database;
  SESSION_SECRET: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REDIRECT_URI?: string;
}

declare module "react-router" {
  interface AppLoadContext {
    cloudflare: { env: CloudflareEnv; ctx: ExecutionContext };
    db: PrismaClient;
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  async fetch(request: Request, env: CloudflareEnv, ctx: ExecutionContext) {
    if (env.SESSION_SECRET) process.env.SESSION_SECRET = env.SESSION_SECRET;
    const adapter = new PrismaD1(env.DB);
    const db = new PrismaClient({ adapter });
    try {
      return await requestHandler(request, { cloudflare: { env, ctx }, db });
    } finally {
      ctx.waitUntil(db.$disconnect());
    }
  },
} satisfies ExportedHandler<CloudflareEnv>;
```

---

## Prisma 7 + D1 rules

- **No `url` in `schema.prisma`** — Prisma 7 moved the datasource URL to `prisma.config.ts`
- **No `previewFeatures = ["driverAdapters"]`** — promoted to stable in Prisma 7, remove it
- **No `migration_lock.toml` with `postgresql`** — delete it when switching providers so Prisma regenerates it
- Local dev uses Miniflare's SQLite at `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite`

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
}
```

```ts
// prisma.config.ts
export default {
  schema: "./prisma/schema.prisma",
  datasource: { url: "file:./dev.db" },
};
```

---

## Session storage in Workers

Use lazy initialization so `SESSION_SECRET` (injected by Worker at request time) is available before the storage is created:

```ts
// app/lib/session.server.ts
import { createCookieSessionStorage } from "react-router";

type SessionData = { userId: string };

let _storage: ReturnType<typeof createCookieSessionStorage<SessionData>> | null = null;

function getStorage() {
  if (!_storage) {
    const secret = process.env.SESSION_SECRET;
    if (!secret) throw new Error("SESSION_SECRET is not set");
    _storage = createCookieSessionStorage<SessionData>({
      cookie: { name: "__session", httpOnly: true, secure: true, secrets: [secret], sameSite: "lax", path: "/" },
    });
  }
  return _storage;
}

export const getSession = (cookie?: string | null) => getStorage().getSession(cookie);
export const commitSession = (...args: Parameters<ReturnType<typeof createCookieSessionStorage>["commitSession"]>) => getStorage().commitSession(...args);
export const destroySession = (...args: Parameters<ReturnType<typeof createCookieSessionStorage>["destroySession"]>) => getStorage().destroySession(...args);
```

---

## No Node.js APIs in Workers

Workers run in a V8 isolate with no Node.js runtime. Do not use:

| Avoid | Use instead |
|---|---|
| `bcryptjs` | `crypto.subtle` (Web Crypto PBKDF2) |
| `renderToPipeableStream` | `renderToReadableStream` |
| `fs`, `path`, `process.env` (at module init) | Runtime env via `env.*` bindings |
| `require()`, `module.exports` | ESM `import`/`export` |

---

## Auth: Web Crypto PBKDF2 pattern

Replaces `bcryptjs` for password hashing — works in Workers, browsers, and Deno:

```ts
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, key, 256);
  const hash = new Uint8Array(bits);
  return `${btoa(String.fromCharCode(...salt))}:${btoa(String.fromCharCode(...hash))}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltB64, hashB64] = stored.split(":");
  const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
  const expectedHash = Uint8Array.from(atob(hashB64), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, key, 256);
  const actualHash = new Uint8Array(bits);
  return actualHash.length === expectedHash.length && actualHash.every((b, i) => b === expectedHash[i]);
}
```

---

## Context pattern — passing `db` to loaders/actions

All loaders and actions receive the Prisma client via `context.db`. Never import a module-level db singleton.

```ts
// In any loader or action:
export async function loader({ request, context }: Route.LoaderArgs) {
  const user = await requireAuth(context.db, request);
  const trips = await context.db.trip.findMany({ where: { userId: user.id } });
  return { trips };
}
```

---

## Deploy sequence

Always deploy in this exact order — never run `wrangler deploy` directly without building first:

```bash
npm run build    # runs prisma generate + react-router build
wrangler deploy  # uploads the built bundle to Cloudflare
```

The `build` script in `package.json` must always include `prisma generate` before `react-router build`:

```json
"build": "prisma generate --schema ./prisma/schema.prisma && react-router build"
```

**Why:** Prisma generates its client files into `node_modules/.prisma/client/` at generate time. If `prisma generate` hasn't run before Vite bundles the Worker, the `.prisma/client/default` module won't exist in the bundle. Cloudflare will reject the deploy with:
```
Error: No such module ".prisma/client/default" [code: 10021]
```

---

## Debugging checklist

If the app breaks after a config change, verify in order:

1. `react-router.config.ts` has `future: { v8_viteEnvironmentApi: true }`
2. `vite.config.ts` has no custom `environments` or `optimizeDeps` blocks
3. `app/entry.server.tsx` exists and uses `renderToReadableStream`
4. No CJS-only packages imported in server code (check `require`/`module`)
5. Secrets injected via `.dev.vars` for local dev, Cloudflare dashboard for production
6. Compare against the official template: `github.com/remix-run/react-router-templates/tree/main/cloudflare`
