# Cloudflare Workers + React Router v7 — Troubleshooting Lessons

## Summary

This document captures the issues encountered and fixes applied when migrating a React Router v7 app to run on Cloudflare Workers with D1 (SQLite).

---

## Issue 1: `module is not defined`

**Error:**
```
[vite] Internal server error: module is not defined
  at null.<anonymous> (node_modules/react/jsx-dev-runtime.js?v=...:6:3)
```

**Root cause:**
Cloudflare Workers run in a V8 isolate — there is no Node.js runtime, no `require`, no `module`. React's `jsx-dev-runtime.js` is a CommonJS (CJS) file. Without the Vite Environment API enabled, Vite doesn't pre-bundle CJS packages into ESM before the Workers module runner loads them.

**Fix:**
Add `future: { v8_viteEnvironmentApi: true }` to `react-router.config.ts`. This enables Vite's Environment API, which is required by `@cloudflare/vite-plugin` to properly handle CJS → ESM conversion for the Workers runtime.

```ts
// react-router.config.ts
export default {
  ssr: true,
  future: {
    v8_viteEnvironmentApi: true,
  },
} satisfies Config;
```

**Note:** The flag was originally called `unstable_viteEnvironmentApi`. It was promoted/renamed to `v8_viteEnvironmentApi` in a later version of `@react-router/dev`. Using the old name throws:
```
Error: The "future.unstable_viteEnvironmentApi" flag has been stabilized as "future.v8_viteEnvironmentApi"
```

---

## Issue 2: `renderToPipeableStream is not a function`

**Error:**
```
TypeError: renderToPipeableStream is not a function
```

**Root cause:**
React Router v7's default `entry.server.tsx` (when not explicitly created) uses `renderToPipeableStream` from `react-dom/server`. This is a Node.js streams API — it does **not** exist in the Cloudflare Workers runtime.

**Fix:**
Create `app/entry.server.tsx` explicitly, using `renderToReadableStream` instead. This is the Web Streams API and works natively in Workers.

```tsx
// app/entry.server.tsx
import { renderToReadableStream } from "react-dom/server";

export default async function handleRequest(
  request, responseStatusCode, responseHeaders, routerContext
) {
  const body = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    { onError(error) { console.error(error); } }
  );

  if (isbot(request.headers.get("user-agent") ?? "")) {
    await body.allReady;
  }

  responseHeaders.set("Content-Type", "text/html");
  return new Response(body, { headers: responseHeaders, status: responseStatusCode });
}
```

---

## Issue 3: Unnecessary `optimizeDeps` / `environments` config in `vite.config.ts`

**What happened:**
An earlier attempt to fix the `module is not defined` error added manual `optimizeDeps.exclude` and `environments` config blocks to `vite.config.ts`. These were not needed and were masking the real fix.

**Fix:**
Keep `vite.config.ts` clean and minimal — exactly like the official template:

```ts
// vite.config.ts
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

## Key Concepts Reinforced

| Concept | Detail |
|---|---|
| Cloudflare Workers runtime | V8 isolate — no Node.js, no `require`, no `module` |
| CJS vs ESM | Workers only support ESM. CJS packages must be pre-bundled to ESM by Vite |
| `v8_viteEnvironmentApi` flag | Required for `@cloudflare/vite-plugin` to handle the Workers module environment |
| `renderToReadableStream` | Web Streams API — works in Workers and browsers |
| `renderToPipeableStream` | Node.js Streams API — does NOT work in Workers |
| `entry.server.tsx` | Must be created explicitly when targeting Workers; React Router's implicit default uses the wrong renderer |

---

## How to Compare Against the Official Template

When hitting unexplained errors with the Cloudflare + React Router setup, compare your project against the official template:

```
https://github.com/remix-run/react-router-templates/tree/main/cloudflare
```

Key files to diff:
- `react-router.config.ts` — check `future` flags
- `vite.config.ts` — should be minimal, no custom environments
- `app/entry.server.tsx` — must exist and use `renderToReadableStream`
- `workers/app.ts` — Worker entry point with per-request PrismaClient
