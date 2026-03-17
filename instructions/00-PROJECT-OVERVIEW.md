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

- **Framework**: React Router (framework mode) for SSR and routing
- **Linting**: ESLint
- **Formatting**: Prettier
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui
- **Forms**: Conform with Zod validation
- **State Management**: React Router loaders/actions + React state
- **Unit and Integration tests**: Vitest + React Testing Library
- **E2E tests**: Playwright
- **Rich text editor**: Tiptap
- **Maps**: Leaflet or Mapbox
- **Image handling**: TBD

### Backend

- **Runtime**: Node.js
- **Database**: SQLite with Prisma ORM
- **Unit and Integration tests**: Vitest
- **File storage**: TBD (local for dev, Cloudinary/S3 for production)
- **Authentication**: TBD (JWT or session-based)

### AI Integration

- **MCP Server**: Custom implementation for travel journal operations
- **AI Models**: Claude (via Anthropic API) through MCP clients

## Development Approach

Using AI Agents for accelerated development with clear specifications and iterative building.

## Project Phases

### Phase 1: MVP (Minimum Viable Product)

- User authentication
- Trip management (CRUD)
- Journal entries with text and photos
- Private-only mode

### Phase 2: AI & Sharing

- MCP server implementation
- AI-assisted entry creation
- Public sharing functionality
- Export capabilities

### Phase 3: Advanced Features

- Basic expense tracking
- Timeline and map visualization
- Statistics and analytics
- Collaboration features
- Offline support (PWA)
- Advanced search

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

- Real-time collaboration
- Booking integrations
- Route planning/optimization
