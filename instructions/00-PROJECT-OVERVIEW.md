# Travel Journal App - Project Overview

## Vision

A digital travel journal application that allows users to document their travels, organize experiences, track expenses, and optionally share their journeys publicly. The app will integrate with AI through MCP (Model Context Protocol) to assist in creating and managing entries.

## Target Users

- Digital nomads and travelers who want to document their experiences
- Couples or groups traveling together
- Travel bloggers who want a private workspace before publishing
- Anyone who wants to maintain an organized record of their travels

## Travel Style

Medium structure: Not backpacker style but not overly structured either. Balance between spontaneity and organization.

## Core Value Propositions

1. **Private by default**: Personal space to document travels without pressure to publish
2. **AI-assisted journaling**: Use AI to help create, organize, and enrich entries
3. **Financial tracking**: Keep expenses organized by trip and category
4. **Visual storytelling**: Photos and maps integrated into the narrative
5. **Selective sharing**: Choose what to make public when ready

## Tech Stack

### Frontend

- **Framework**: React 19 + React Router v7 (framework mode, SSR enabled)
- **Runtime**: Cloudflare Workers (via `@react-router/cloudflare`)
- **Database**: Cloudflare D1 (SQLite, managed via raw SQL migrations in `d1/migrations/`)
- **Linting**: ESLint (flat config, TypeScript + React + Prettier)
- **Formatting**: Prettier with Tailwind plugin
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui (Radix Nova preset) + Radix UI primitives + Lucide React icons
- **Notifications**: Sonner (toast)
- **Theme**: next-themes
- **Forms**: Conform (`@conform-to/react` + `@conform-to/zod`) with Zod v4 validation
- **ID generation**: CUID2 (`@paralleldrive/cuid2`)
- **Unit and Integration tests**: Vitest + React Testing Library + jest-axe (accessibility)
- **E2E tests**: Playwright + `@axe-core/playwright` (accessibility)
- **Build**: Vite 7 with `@cloudflare/vite-plugin`

### Backend

- **Runtime**: Cloudflare Workers (same process as frontend via React Router loaders/actions)
- **Database**: Cloudflare D1 (SQLite) — local dev via Wrangler, remote via D1 managed service
- **Authentication**: Cookie-based sessions (30-day expiry) + PBKDF2 password hashing (Web Crypto API) + Google OAuth 2.0
- **Architecture**: Repository pattern (`app/lib/repositories/`) with Zod schema validation, `Result<T>` type for typed error handling

### AI Integration

- **MCP Server**: Custom implementation for travel journal operations (planned — Phase 2)
- **AI Models**: Claude (via Anthropic API) through MCP clients

### Deployment

- **Platform**: Cloudflare Workers
- **Database**: Cloudflare D1
- **Deploy command**: `npm run deploy:cloudflare` (migrate → seed → build → deploy)
- **Dev**: `npm run dev` (Vite dev server) or `npm run preview` (Wrangler)

## Architecture

### Key Patterns

- **Repository pattern**: `app/lib/repositories/` — `UserRepository`, `SessionRepository`, `TripRepository`, `MemoryRepository`, `ExpenseRepository`, `AccountRepository`
- **Schema validation**: `app/lib/schemas/` — Zod schemas for all domain entities, validated at DB/API boundaries
- **Result type**: `app/lib/result.ts` — `Result<T>` with `ok()` / `err()` for typed error handling without exceptions
- **Server context**: `AppLoadContext` provides Cloudflare env (DB, secrets), `ExecutionContext`, and all repositories to loaders/actions
- **Authentication helpers**: `requireAuth()` for protected routes, `getUser()` for optional checks

### Project Structure

```
/
├── app/
│   ├── components/
│   │   ├── layout/        ← AppShell, navigation
│   │   └── ui/            ← shadcn/ui components
│   ├── lib/
│   │   ├── repositories/  ← Data access layer (D1 queries)
│   │   ├── schemas/       ← Zod entity schemas
│   │   ├── auth.server.ts ← Session + password helpers
│   │   ├── result.ts      ← Result<T> type
│   │   └── validations.ts ← Form validation utilities
│   ├── routes/            ← React Router route modules
│   └── routes.ts          ← Code-based routing config
├── workers/
│   └── app.ts             ← Cloudflare Worker entry (createRepositories, AppLoadContext)
├── d1/
│   └── migrations/        ← Raw SQL migration files
├── tests/
│   ├── unit/              ← Vitest unit tests
│   └── e2e/               ← Playwright E2E tests
├── wrangler.toml          ← Production Cloudflare config
└── wrangler.e2e.toml      ← E2E test config (isolated DB)
```

## Development Approach

Using AI Agents for accelerated development with clear specifications and iterative building.

## Project Phases

### Phase 1: MVP ✅ COMPLETED

- ✅ User authentication (email/password + Google OAuth 2.0, session cookies)
- ✅ Password reset flow (token-based)
- ✅ Trip management (create, view, edit — status: PLANNED/ONGOING/COMPLETED, budget, currency)
- ✅ Memory/journal entries (create, view, edit — with location, category, rating, photos schema)
- ✅ Expense tracking (create, view — linked to trip and optional memory, multi-currency)
- ✅ User profile (view and edit — displayName, avatar, bio)
- ✅ App shell layout with authenticated navigation
- ✅ Unit tests (auth, validations, accessibility)
- ✅ E2E tests (full user flows: register → trip → memory, with accessibility checks)
- ✅ Migrated to Cloudflare Workers + D1 (from Node.js + Prisma)

### Phase 2: AI & Sharing 🚧 IN PROGRESS

- ⬜ Public sharing routes (`/:username`, `/:username/:tripSlug`, `/:username/:tripSlug/:memorySlug`) — schema ready (`isPublic`, `slug` fields exist), routes commented out
- ⬜ Trip/memory slug generation on publish
- ⬜ MCP server implementation for AI-assisted journaling
- ⬜ AI-assisted entry creation (Claude via Anthropic API)
- ⬜ Export capabilities

### Phase 3: Advanced Features ⬜ PLANNED

- ⬜ Rich text editor (Tiptap)
- ⬜ Map visualization (Leaflet or Mapbox)
- ⬜ Photo upload and management (Cloudinary or R2)
- ⬜ Timeline view
- ⬜ Statistics and analytics
- ⬜ Collaboration features
- ⬜ Offline support (PWA)
- ⬜ Advanced search

## Success Metrics

- Ability to create and organize multiple trips
- Quick entry creation (under 2 minutes)
- Seamless photo upload and organization
- Clear expense tracking per trip
- Easy transition from private to public sharing

## Design Principles

1. **Content first**: The journal entries are the star
2. **Clean and minimal**: Don't overwhelm with features
3. **Mobile-friendly**: Many entries will be created on mobile
4. **Fast**: Quick loading and responsive interactions
5. **Intuitive**: Minimal learning curve

## Out of Scope (for now)

- Social network features (likes, follows, feeds)
- Real-time collaboration
- Mobile native apps (web-first approach)
- Booking integrations
- Route planning/optimization
