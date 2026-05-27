# Roadmap & Pending Features

Living document. Update this as features are built or priorities shift.

## In Progress

- [ ] Stabilize `playwright-tests` branch — commit uncommitted changes, run full test suite

## Pending — Core

- [ ] **Trip status staleness hints** — When a Trip's dates suggest the status may be outdated (e.g., start date has passed but status is still PLANNED, or end date has passed but status is still ONGOING), show an inline prompt on the trip card/detail suggesting the user update it. Status remains fully manual — this is a nudge only.
- [ ] **Trip & Destination cover image upload** — `coverImage` field exists (plain URL string). Upload should write directly to R2 and store the URL — does NOT go through the Photo table (cover images are single decorative fields, not ordered/captioned Photo records).
- [ ] **Photo upload size/count limits** — No server-side enforcement yet. `MAX_FILE_SIZE = 10MB` is client-side only.
- [ ] **Password reset flow** — Token model exists in DB (`PasswordResetToken`) but the reset pages/emails are not wired up.
- [ ] **Multi-currency budget reconciliation** — Each Expense has its own currency field but `sumByTrip()` adds raw numbers regardless of currency. For now all expenses in a trip should use the trip's base currency. When implemented, requires exchange rate lookup or manual conversion input.

## Pending — Sharing

- [ ] **Public trip sharing** — Schema ready (`isPublic`, `slug` fields on Trip and Memory). Routes commented out. Needs slug generation on publish + public-facing pages.
- [ ] **Trip/memory slug generation** — Auto-generate on first publish. Unique per user for trips, unique per trip for memories.

## Pending — AI

- [ ] **MCP server** — Custom MCP implementation for AI-assisted journaling (Claude via Anthropic API). Phase 2.
- [ ] **AI-assisted memory creation** — Use Claude to help draft or enrich memory content.

## Pending — Enhancements

- [ ] **Map visualization** — `latitude`/`longitude` fields exist on Memory and Destination but no map UI yet. Leaflet or Mapbox.
- [ ] **Timeline view** — Trip detail has a Timeline tab placeholder.
- [ ] **Rich text editor** — Memory content is plain text. Tiptap planned for Phase 3.
- [ ] **Pagination** — All `find*()` repository methods return unbounded result sets. Fine at personal scale; add limit/offset when needed.
- [ ] **Destination reorder UI** — `reorder()` method exists in DestinationRepository but no drag-and-drop UI.
- [ ] **Google OAuth** — `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` bindings exist in wrangler config but OAuth flow is not implemented.
- [ ] **Export** — No export capability yet (PDF, markdown, etc).
