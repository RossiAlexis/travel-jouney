# 🧳 Travel Journal

A full-stack travel journaling app for documenting trips through memories, photos, destinations, and expenses — private by default, with selective public sharing via clean, shareable URLs (`/:username/:tripSlug`).

Built as a portfolio project to demonstrate production-grade patterns end-to-end: edge-first architecture, type-safe forms, a repository-based data layer, and a real automated test suite (unit + e2e + accessibility) rather than a toy CRUD demo.

## Overview

Users organize their travel into **Trips**, each containing an ordered list of **Destinations** and a timeline of **Memories** (journal entries with category, rating, location, and photos). **Expenses** are tracked per trip and checked against an optional budget. Any trip can be published with one toggle, generating a permanent slug and a public read-only page — the slug is frozen at publish time, so renaming a trip never breaks a shared link.

## Features

- 🔐 **Authentication** — email/password (bcrypt) with session cookies, forgot/reset password flow
- 🗺️ **Trips & Destinations** — full CRUD, trip lifecycle status (planned / ongoing / completed)
- 📔 **Memories** — journal entries with categories, ratings, geolocation, and photo galleries (Cloudflare R2)
- 💰 **Expenses & Budgets** — per-trip expense tracking with category breakdowns against a budget target
- 🌍 **Public sharing** — one-click publish to a stable, frozen-slug public URL, independent from private editing views
- ♿ **Accessibility-checked** — automated axe-core checks in both unit and e2e suites
- ✅ **Tested** — Vitest unit tests + Playwright end-to-end coverage across trips, destinations, memories, expenses, and public routes

## Tech Stack

**Frontend**
- [React 19](https://react.dev/) + [React Router v7](https://reactrouter.com/) (framework mode, server-side rendered)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/)
- [Conform](https://conform.guide/) + [Zod](https://zod.dev/) for type-safe, progressively-enhanced forms
- [Lucide](https://lucide.dev/) icons

**Backend & Infrastructure**
- [Cloudflare Workers](https://workers.cloudflare.com/) — edge runtime, SSR
- [Cloudflare D1](https://developers.cloudflare.com/d1/) — SQLite at the edge, accessed via [Prisma ORM](https://www.prisma.io/)
- [Cloudflare R2](https://developers.cloudflare.com/r2/) — object storage for trip/memory photos
- Repository pattern for data access (`app/lib/repositories`) decoupling routes from persistence

**Testing & Quality**
- [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) for unit tests
- [Playwright](https://playwright.dev/) for end-to-end tests
- [axe-core](https://github.com/dequelabs/axe-core) / jest-axe for automated accessibility audits
- ESLint + Prettier, strict TypeScript

## Architecture

The app runs as a single Cloudflare Worker (`workers/app.ts`) serving a server-rendered React Router application — no separate API layer. Routes live under `app/pages`, data access goes through typed repositories backed by Prisma against D1, and uploaded photos are streamed to R2 with only the resulting URL persisted in the database.

Architectural decisions are recorded as lightweight ADRs in [`docs/adr`](docs/adr), and the project's domain vocabulary (Trip, Memory, Destination, Visibility, etc.) is documented in [`CONTEXT.md`](CONTEXT.md).

## Getting Started

### Prerequisites
- Node.js 18+
- [pnpm](https://pnpm.io/) 10+
- A [Cloudflare account](https://dash.cloudflare.com/) (for D1/R2 — local dev uses Wrangler's local emulation)

### Installation

```bash
pnpm install
```

### Local Database

```bash
pnpm db:migrate   # apply D1 migrations locally
pnpm db:seed      # seed local data
```

### Development

```bash
pnpm dev
```

The app will be available at `http://localhost:5173`.

### Testing

```bash
pnpm test:unit       # Vitest unit tests
pnpm test:e2e        # Playwright end-to-end tests
pnpm check           # typecheck + lint + full test suite
```

## Deployment

Deployed on Cloudflare Workers with D1 and R2 bindings configured in `wrangler.toml`:

```bash
pnpm deploy:cloudflare
```

See [`CLOUDFLARE_DEPLOY.md`](CLOUDFLARE_DEPLOY.md) and [`docs/cloudflare-architecture.md`](docs/cloudflare-architecture.md) for the full deployment setup and architecture notes.

## Project Structure

```
app/
├── pages/            # Route components (auth, trips, profile, public)
├── components/       # UI components (shadcn/ui + layout)
├── lib/
│   ├── repositories/  # Data access layer (Trip, Memory, Destination, Expense, ...)
│   ├── schemas/       # Zod validation schemas
│   └── auth.server.ts # Session/auth logic
├── routes.ts          # Route configuration
prisma/                # Prisma schema (D1/SQLite)
d1/migrations/         # D1 SQL migrations
docs/adr/               # Architectural decision records
tests/
├── unit/              # Vitest unit + accessibility tests
└── e2e/               # Playwright end-to-end tests
```

## Roadmap

Actively developed — see [`docs/roadmap.md`](docs/roadmap.md) for in-progress and planned work, including map visualization, a rich text editor, and AI-assisted journaling via MCP.

---

Built by [Alexis Rossi](https://github.com/RossiAlexis).
