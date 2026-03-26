# Vite Deep Dive — From Basics to the Environment API

A complete guide to understanding what Vite actually does, why it exists, and what `v8_viteEnvironmentApi` means in the context of React Router + Cloudflare Workers.

---

## Part 1 — What is Vite, really?

Before understanding the Environment API, you need to understand what problem Vite solves and how it works internally.

### The problem before Vite (2015–2020)

When you write a React app, your source code looks like this:

```tsx
// app/dashboard.tsx
import React from "react";
import { useUser } from "./hooks/useUser";
import { DashboardCard } from "./components/DashboardCard";

export function Dashboard() {
  const user = useUser();
  return <DashboardCard user={user} />;
}
```

Browsers cannot execute this file. They don't understand:
- `import` statements from npm packages
- JSX (`<DashboardCard />`)
- TypeScript
- CSS imports

So a **bundler** (Webpack, Rollup, Parcel) would:
1. Start at your entry file (`main.tsx`)
2. Follow every `import` recursively
3. Transform each file (TypeScript → JS, JSX → `React.createElement(...)`)
4. Bundle everything into one or a few `bundle.js` files the browser can run

This worked, but had a massive problem: **every time you changed one file, the entire bundle had to be rebuilt**. On a large app, this could take 10–60 seconds per change. Your feedback loop was terrible.

---

### How Vite solves this

Vite's insight (2020, by Evan You, creator of Vue) was: **modern browsers already support ES Modules natively**. You can do this in a browser today:

```html
<script type="module">
  import { Dashboard } from "/app/dashboard.tsx";
</script>
```

The browser sends an HTTP request for `/app/dashboard.tsx`, then reads that file's imports and sends more HTTP requests for each dependency — automatically, natively.

So instead of pre-bundling everything, Vite runs a **dev server** that:

1. Serves your source files directly over HTTP
2. Transforms files **on demand** — only when the browser requests them
3. Uses **esbuild** (written in Go, 100x faster than JS bundlers) to do each transformation in ~1ms

The result: **instant server start** and **instant hot module replacement (HMR)**. It doesn't matter if your app has 10 files or 10,000. Cold start is always fast because Vite does zero work upfront.

```
WEBPACK (old way):               VITE (new way):
─────────────────────            ──────────────────────────────────
npm run dev                      npm run dev
  → read all 3,000 files         → start HTTP server immediately (50ms)
  → parse all imports
  → transform all TS/JSX         browser requests /app/dashboard.tsx
  → bundle everything            → Vite transforms only that file (1ms)
  → 45 seconds later...          → browser gets the module
  → "Ready on localhost:3000"    → browser requests its dependencies
                                 → Vite transforms each on demand
```

---

### The two phases of Vite

Vite has two completely different modes:

#### 1. Dev mode (`vite dev`)
- No bundling at all
- Pure ESM served directly to the browser
- Each file is an individual HTTP request
- Files are transformed on demand using esbuild
- HMR: when you save a file, only that module is re-fetched

#### 2. Build mode (`vite build`)
- Uses **Rollup** (not esbuild) to bundle everything
- Produces optimized, minified output files
- Tree-shaking (removes unused code)
- Code splitting (lazy-loaded chunks)
- Output is ready to deploy

The reason Vite uses esbuild in dev and Rollup in build is: esbuild is extremely fast but has limited plugin ecosystem. Rollup is slower but has a mature plugin ecosystem and produces optimal bundles.

---

### What Vite transforms

When a file is requested, Vite runs a **plugin pipeline** on it. Each plugin can inspect and transform the file. Here's what happens to your `dashboard.tsx`:

```
dashboard.tsx (raw source)
  ↓
[vite:esbuild plugin]        TypeScript stripped, JSX → React.createElement(...)
  ↓
[vite:css-modules plugin]    Any CSS module imports handled
  ↓
[tailwindcss plugin]         Tailwind classes scanned and CSS generated
  ↓
[tsconfigPaths plugin]       `@/components/...` paths resolved to real paths
  ↓
dashboard.js (browser-ready ESM module)
```

This pipeline runs **per file, per request**, only when needed.

---

## Part 2 — The module system problem (CJS vs ESM)

This is the root of why `v8_viteEnvironmentApi` exists. You need to understand this conflict deeply.

### CommonJS (CJS) — the old way

Node.js was invented in 2009. At that time, JavaScript had no official module system. The Node.js team invented their own: **CommonJS**.

```js
// CommonJS module (old)
const React = require("react");
const { useState } = require("react");

module.exports = { MyComponent };
module.exports.default = MyComponent;
```

Key characteristics:
- `require()` is **synchronous** — it blocks until the file is loaded
- `module` and `exports` are magic globals injected by Node.js
- Modules are loaded lazily (only when `require()` is called)
- Works only in Node.js (browsers never had `require`)

Almost every npm package published before ~2019 is CJS.

### ES Modules (ESM) — the modern way

In 2015, JavaScript finally got an official module system: **ES Modules**, part of ES2015 (ES6).

```js
// ES Module (modern)
import React from "react";
import { useState } from "react";

export { MyComponent };
export default MyComponent;
```

Key characteristics:
- `import`/`export` are **static** — the dependency graph is known before execution
- Browsers support this natively (via `<script type="module">`)
- Node.js added support in v12+ (files with `.mjs` extension or `"type": "module"` in package.json)
- **No `require`, no `module`, no `exports` globals** — these simply don't exist in ESM

### The conflict

Here's the problem. Open `node_modules/react/jsx-dev-runtime.js`:

```js
// node_modules/react/jsx-dev-runtime.js (React 19, still CJS!)
'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-jsx-dev-runtime.production.js');
} else {
  module.exports = require('./cjs/react-jsx-dev-runtime.development.js');
}
```

React itself — one of the most popular libraries in the world — ships as **CommonJS**. It uses `module.exports` and `require()`.

In a Node.js environment, this is fine. Node.js provides `module`, `require`, etc.

But in Cloudflare Workers — a V8 isolate — **there is no Node.js**. The Workers runtime provides:
- Web APIs (`fetch`, `Request`, `Response`, `crypto`, etc.)
- V8 JavaScript engine
- Nothing else

When the Workers runtime tries to run `react/jsx-dev-runtime.js` and hits `module.exports = ...`, it throws:

```
ReferenceError: module is not defined
```

Because `module` simply doesn't exist in that environment.

### How Vite normally solves this

In normal SSR mode (targeting Node.js), Vite doesn't need to worry about CJS files — Node.js handles them natively. So Vite would just let `require('react')` pass through to Node.js.

But for Workers, Vite needs to **pre-bundle** CJS packages by converting them to ESM. This is called **dependency pre-bundling** and Vite uses esbuild to do it.

When esbuild converts `react/jsx-dev-runtime.js` from CJS to ESM, the result looks roughly like:

```js
// After esbuild CJS→ESM conversion
var jsx_dev_runtime = {};
var __exports = {};

// The CJS code runs in a wrapper that provides fake `module`/`exports`
(function(module, exports) {
  'use strict';
  // ... original CJS code ...
  module.exports = require('./cjs/react-jsx-dev-runtime.development.js');
})(jsx_dev_runtime, __exports);

export default jsx_dev_runtime;
export const { jsxDEV, Fragment } = jsx_dev_runtime;
```

Now the file is valid ESM that doesn't need `module` to exist in the global scope.

---

## Part 3 — Vite's Environment API

### The old architecture (single environment)

Before the Environment API, Vite had a **single server** with two implicit "sides":

```
Vite Dev Server
├── client (browser)     → ESM, hot module replacement, browser globals
└── ssr (server)         → Node.js, same process as Vite itself
```

The "ssr" side ran in the same Node.js process as Vite. This meant:
- SSR code had access to all Node.js APIs
- Pre-bundling decisions were made once for both sides
- You couldn't run SSR code in a different runtime

This worked fine for Next.js, Remix, etc. targeting Node.js servers.

### The new problem: non-Node runtimes

When Cloudflare Workers, Deno, Bun, and edge runtimes appeared, they all had different constraints:

| Runtime | Has `require`? | Has `fs`? | Has `process`? | Module system |
|---|---|---|---|---|
| Node.js | Yes | Yes | Yes | CJS + ESM |
| Cloudflare Workers | No | No | Partial | ESM only |
| Deno | No | Yes (different API) | No | ESM only |
| Browser | No | No | No | ESM only |

Vite needed a way to say: **"When building for Workers, apply these specific rules: no CJS, no Node.js globals, pre-bundle everything to ESM"**.

### What the Environment API is

The **Vite Environment API** (introduced in Vite 6) allows you to define multiple distinct **runtime environments** within a single Vite server, each with its own:

- Module resolution rules
- Pre-bundling configuration
- Runtime (Node.js, Workerd, browser, etc.)
- Transform pipeline

Think of it as Vite going from a one-size-fits-all server to a configurable multi-target build system.

```
Before Environment API:          After Environment API:
─────────────────────────        ──────────────────────────────────────
Vite Dev Server                  Vite Dev Server
├── client (browser)             ├── client environment
└── ssr (Node.js only)           │   ├── runtime: browser
                                 │   ├── pre-bundle: CJS→ESM
                                 │   └── HMR: yes
                                 │
                                 └── ssr environment
                                     ├── runtime: workerd (Workers)
                                     ├── pre-bundle: ALL CJS→ESM (strict)
                                     ├── no Node.js globals
                                     └── module runner: Miniflare
```

### How `@cloudflare/vite-plugin` uses the Environment API

When you add `cloudflare({ viteEnvironment: { name: "ssr" } })` to your Vite config, this plugin:

1. **Registers a custom environment** named `"ssr"` that uses the **Workerd runtime** (Cloudflare's open-source Workers runtime) instead of Node.js

2. **Configures strict ESM-only mode** for that environment — any CJS import is automatically pre-bundled to ESM by esbuild before the module runner sees it

3. **Runs your server code inside Miniflare** (local Workers emulator) — so `env.DB`, `env.SESSION_SECRET`, `crypto.subtle`, etc. all work exactly as they would in production

4. **Isolates the module graph** — the client environment and the ssr (Workers) environment have separate module graphs, separate caches, and separate pre-bundled dependencies

Without this plugin and the Environment API, Vite would run your server code in Node.js, where `module` and `require` are available. Your app would work in development but **fail in production** (Workers) because you'd never catch the CJS compatibility issues.

---

## Part 4 — What `v8_viteEnvironmentApi` actually does

### The flag

```ts
// react-router.config.ts
export default {
  ssr: true,
  future: {
    v8_viteEnvironmentApi: true,
  },
} satisfies Config;
```

This is a **React Router feature flag**. The name `v8` means it will become the default behavior in React Router v8. The `viteEnvironmentApi` part means: "opt into using Vite's Environment API".

When this flag is **off** (the old behavior):

```
React Router dev server
├── Registers Vite plugin (reactRouter())
├── Assumes SSR runs in Node.js
└── Does NOT set up a custom Vite environment
    → Vite uses its default SSR mode (Node.js process)
    → CJS packages like react/jsx-dev-runtime are NOT pre-bundled
    → Works fine for Node.js servers
    → BREAKS in Cloudflare Workers (module is not defined)
```

When this flag is **on** (the new behavior):

```
React Router dev server
├── Registers Vite plugin (reactRouter())
├── Signals to Vite: "I'm using the Environment API"
└── Works with @cloudflare/vite-plugin's custom environment
    → Vite sets up the "ssr" environment with Workerd runtime
    → ALL CJS packages are pre-bundled to ESM before the module runner
    → react/jsx-dev-runtime.js → esbuild → valid ESM → no "module is not defined"
    → Works in Cloudflare Workers
```

### The sequence of events when you run `npm run dev`

Here's exactly what happens, step by step:

```
1. `react-router dev` starts
2. Reads react-router.config.ts → sees v8_viteEnvironmentApi: true
3. Starts Vite with the plugin pipeline:

   [cloudflare plugin]
   ├── Creates "ssr" environment with Workerd runner
   ├── Configures: no CJS allowed, pre-bundle everything
   └── Starts Miniflare (local Workers emulator)

   [reactRouter plugin]
   ├── Sees v8_viteEnvironmentApi: true
   ├── Registers routes from app/routes.ts
   └── Sets up HMR for route modules

4. Vite starts the dev server on localhost:5173

5. Browser requests http://localhost:5173/
6. Vite routes the request to the "ssr" environment (Miniflare/Workerd)
7. Workers runtime executes workers/app.ts
8. workers/app.ts imports virtual:react-router/server-build
9. React Router's server build imports your routes
10. Your routes import react, react-router, etc.

11. Vite intercepts each import in the "ssr" environment:
    - react/jsx-dev-runtime.js → CJS detected → esbuild pre-bundles to ESM → serves ESM
    - react-router → already ESM → serves directly
    - @prisma/client → CJS detected → esbuild pre-bundles to ESM → serves ESM

12. No module/require globals needed → no errors
13. Your loader runs, Prisma queries D1, response is streamed back
14. Browser receives HTML
```

---

## Part 5 — The full picture in this project

Here's how all the pieces fit together in this app:

```
┌─────────────────────────────────────────────────────────────────┐
│                         npm run dev                              │
│                    (react-router dev)                            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │    Vite 6   │
                    │  Dev Server │
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          │                                 │
   ┌──────▼──────┐                  ┌───────▼──────┐
   │   client    │                  │     ssr       │
   │ environment │                  │ environment   │
   │             │                  │               │
   │  runtime:   │                  │  runtime:     │
   │  browser    │                  │  Workerd      │
   │             │                  │  (Miniflare)  │
   │  HMR ✓      │                  │               │
   │  React.tsx  │                  │  workers/     │
   │  CSS        │                  │  app.ts       │
   │  assets     │                  │               │
   └──────┬──────┘                  └───────┬───────┘
          │                                 │
          │ serves to browser               │ handles SSR requests
          │                                 │
   ┌──────▼──────┐                  ┌───────▼──────────────┐
   │   Browser   │◄─── HTML ────────│  React Router SSR    │
   │             │                  │                      │
   │  hydrates   │                  │  entry.server.tsx    │
   │  React app  │                  │  renderToReadable    │
   └─────────────┘                  │  Stream()            │
                                    └───────┬──────────────┘
                                            │
                                    ┌───────▼──────────────┐
                                    │  Your app code       │
                                    │                      │
                                    │  loaders/actions     │
                                    │  → context.db        │
                                    │  → PrismaD1          │
                                    │  → D1 (SQLite)       │
                                    └──────────────────────┘
```

### Why each config file matters

| File | What it does | What breaks without it |
|---|---|---|
| `react-router.config.ts` with `v8_viteEnvironmentApi` | Tells React Router to use Vite's Environment API | Vite uses Node.js SSR mode → CJS packages not pre-bundled → `module is not defined` |
| `vite.config.ts` with `cloudflare()` plugin | Registers Workerd as the SSR runtime | No Workers environment → code runs in Node.js → works locally, fails in production |
| `app/entry.server.tsx` with `renderToReadableStream` | Uses Web Streams API for SSR rendering | Default uses `renderToPipeableStream` (Node.js streams) → not available in Workers |
| `workers/app.ts` | The actual Worker entry point | React Router doesn't know how to handle Workers requests |

---

## Part 6 — Common misconceptions cleared up

### "Vite is just a dev server"

No. Vite is:
- A dev server (with on-demand transforms and HMR)
- A build system (Rollup-based production bundler)
- A plugin platform (transforms, virtual modules, custom environments)
- A module runner (can execute code in different runtimes)

### "The build output is the same as what dev server serves"

No. They're fundamentally different:
- **Dev**: unbundled ESM files served individually, source maps, no minification
- **Build**: bundled, tree-shaken, minified, code-split Rollup output

This is why you should always test your production build too (`npm run build && npm run preview`).

### "esbuild and Rollup are the same thing"

No:
- **esbuild**: Written in Go. Extremely fast (~100x). Limited plugin ecosystem. Used by Vite for dev-time transforms and pre-bundling.
- **Rollup**: Written in JavaScript. Slower but more flexible. Rich plugin ecosystem. Better tree-shaking. Used by Vite for production builds.

### "CJS and ESM are interchangeable"

No. Key differences:

| | CJS | ESM |
|---|---|---|
| Loading | Synchronous (`require` blocks) | Asynchronous (can be parallelized) |
| Globals needed | `module`, `exports`, `require`, `__dirname` | None |
| Static analysis | No (require can be conditional) | Yes (imports are always top-level) |
| Tree-shaking | Not possible | Possible (bundlers can remove unused exports) |
| Browser support | Never (Node.js only) | Native since 2017 |

### "If it works in dev, it will work in production"

**Without** the Cloudflare plugin and Environment API: **false**. Dev runs in Node.js, production runs in Workers — very different environments. Without the plugin, you'd catch `module is not defined` errors only after deploying.

**With** the Cloudflare plugin and `v8_viteEnvironmentApi`: **true**. Dev runs inside Miniflare (local Workers emulator), which is the same V8 isolate environment as production. What works locally will work in production.

---

## Summary

| Concept | One-line explanation |
|---|---|
| Vite | A build tool that serves files as ESM on demand in dev, and bundles with Rollup for production |
| ESM | The modern JavaScript module system (`import`/`export`), supported natively in browsers and Workers |
| CJS | The old Node.js module system (`require`/`module.exports`), not available in Workers |
| Pre-bundling | esbuild converts CJS packages to ESM so they work in Workers |
| Vite Environment API | Lets Vite run different parts of your app in different runtimes (browser, Node.js, Workers) |
| `@cloudflare/vite-plugin` | Registers the Workerd runtime as Vite's SSR environment, enabling pre-bundling for Workers |
| `v8_viteEnvironmentApi` | React Router flag to opt into using Vite's Environment API (required for the Cloudflare plugin to work) |
| `renderToReadableStream` | Web Streams API version of React SSR rendering — works in Workers, browsers, Deno |
| `renderToPipeableStream` | Node.js Streams version of React SSR rendering — does NOT work in Workers |
