# Technical Architecture

## Overview
This document outlines the technical architecture for the Travel Journal application, including stack choices, folder structure, and development patterns.

---

## Tech Stack

### Frontend
- **Framework**: React Router v7 (framework mode) with SSR
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI or shadcn/ui
- **Forms**: Conform with Zod validation
- **Rich Text**: Tiptap
- **Maps**: Leaflet with React-Leaflet
- **Image Optimization**: Sharp (server-side)
- **State Management**: React Router loaders/actions + React state
- **HTTP Client**: Built into React Router (fetch)

### Backend
- **Runtime**: Node.js 20+
- **Server**: Integrated with React Router
- **Database**: SQLite with Prisma ORM
- **Authentication**: Custom JWT implementation or Lucia
- **File Upload**: Multer
- **Image Storage**: Local filesystem (development), Cloudinary or S3 (production)
- **Email**: Resend or Nodemailer

### Development Tools
- **Package Manager**: pnpm (or npm/yarn)
- **Linting**: ESLint
- **Formatting**: Prettier
- **Type Checking**: TypeScript strict mode
- **Testing**: Vitest + React Testing Library
- **E2E Testing**: Playwright (optional)
- **Git Hooks**: Husky + lint-staged

### Deployment
- **Hosting**: Vercel, Netlify, or Railway (with Node.js support)
- **Database**: Neon, Supabase, or Railway PostgreSQL
- **CDN**: Cloudflare or Vercel Edge
- **Monitoring**: Sentry (errors) + Posthog (analytics, privacy-focused)

---

## Project Structure

```
travel-journal/
├── app/
│   ├── routes.ts                # Route configuration
│   ├── components/              # Reusable components
│   │   ├── ui/                  # Base UI components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── modal.tsx
│   │   │   └── ...
│   │   ├── trips/               # Trip-specific components
│   │   │   ├── trip-card.tsx
│   │   │   ├── trip-form.tsx
│   │   │   └── ...
│   │   ├── entries/             # Entry-specific components
│   │   ├── layout/              # Layout components
│   │   │   ├── app-shell.tsx
│   │   │   ├── header.tsx
│   │   │   └── sidebar.tsx
│   │   └── shared/              # Shared components
│   ├── pages/                   # Page components (route handlers)
│   │   ├── home.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── dashboard.tsx
│   │   ├── trips/
│   │   │   ├── trip-detail.tsx
│   │   │   ├── trip-edit.tsx
│   │   │   ├── trip-new.tsx
│   │   │   ├── entry-detail.tsx
│   │   │   ├── entry-edit.tsx
│   │   │   └── entry-new.tsx
│   │   └── profile/
│   │       ├── profile.tsx
│   │       └── profile-edit.tsx
│   ├── lib/                     # Utility functions
│   │   ├── db.server.ts         # Database client
│   │   ├── auth.server.ts       # Authentication utilities
│   │   ├── session.server.ts
│   │   ├── upload.server.ts
│   │   ├── utils.ts             # General utilities
│   │   └── validations.ts       # Zod schemas
│   ├── styles/
│   │   └── tailwind.css
│   ├── types/                   # TypeScript types
│   │   └── index.ts
│   └── root.tsx                 # Root component
├── prisma/
│   ├── schema.prisma            # Database schema
│   ├── migrations/              # Database migrations
│   └── seed.ts                  # Seed data
├── public/                      # Static assets
│   ├── images/
│   └── favicon.ico
├── mcp-server/                  # MCP server (Phase 2)
│   ├── src/
│   │   ├── index.ts
│   │   ├── tools/
│   │   └── resources/
│   └── package.json
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── vite.config.ts
```

---

## Database Schema (Prisma)

```prisma
// prisma/schema.prisma

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id           String    @id @default(cuid())
  email        String    @unique
  passwordHash String
  username     String    @unique
  displayName  String
  avatar       String?
  bio          String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  
  trips        Trip[]
  entries      Entry[]
  expenses     Expense[]
  
  @@index([email])
  @@index([username])
}

model Trip {
  id          String      @id @default(cuid())
  userId      String
  title       String
  description String?
  coverImage  String?
  startDate   DateTime
  endDate     DateTime?
  status      TripStatus  @default(PLANNED)
  isPublic    Boolean     @default(false)
  slug        String?
  destinations String[]   // Array of strings
  budget      Float?
  currency    String      @default("USD")
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  entries     Entry[]
  expenses    Expense[]
  
  @@index([userId])
  @@index([status])
  @@index([isPublic])
  @@unique([userId, slug])
}

enum TripStatus {
  PLANNED
  ONGOING
  COMPLETED
}

model Entry {
  id          String        @id @default(cuid())
  tripId      String
  userId      String
  title       String
  content     String        @db.Text
  date        DateTime
  locationName String?
  locationAddress String?
  latitude    Float?
  longitude   Float?
  placeId     String?
  category    EntryCategory @default(OTHER)
  rating      Int?          // 1-5
  photos      Json[]        // Array of photo objects
  isPublic    Boolean       @default(false)
  slug        String?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  
  trip        Trip          @relation(fields: [tripId], references: [id], onDelete: Cascade)
  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  expenses    Expense[]
  
  @@index([tripId])
  @@index([userId])
  @@index([date])
  @@index([category])
  @@unique([tripId, slug])
}

enum EntryCategory {
  ACCOMMODATION
  FOOD
  ACTIVITY
  TRANSPORT
  REFLECTION
  OTHER
}

model Expense {
  id          String          @id @default(cuid())
  tripId      String
  userId      String
  entryId     String?
  amount      Float
  currency    String
  category    ExpenseCategory
  description String
  date        DateTime
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
  
  trip        Trip            @relation(fields: [tripId], references: [id], onDelete: Cascade)
  user        User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  entry       Entry?          @relation(fields: [entryId], references: [id], onDelete: SetNull)
  
  @@index([tripId])
  @@index([userId])
  @@index([date])
}

enum ExpenseCategory {
  ACCOMMODATION
  FOOD
  TRANSPORT
  ACTIVITIES
  SHOPPING
  OTHER
}
```

---

## Authentication Flow

### Registration
1. User submits email, username, password
2. Validate input (Zod)
3. Check if email/username exists
4. Hash password (bcrypt)
5. Create user in database
6. Create session
7. Redirect to dashboard

### Login
1. User submits email and password
2. Validate input
3. Find user by email
4. Compare password hash
5. Create session
6. Redirect to dashboard

### Session Management
- Use HTTP-only cookies for session tokens
- JWT or database sessions (recommended: database sessions for better control)
- Session expiry: 30 days (remember me) or 1 day (default)
- Middleware to check authentication on protected routes

### Password Reset
1. User requests reset with email
2. Generate reset token (UUID)
3. Store token in database with expiry
4. Send email with reset link
5. User clicks link, enters new password
6. Validate token, update password
7. Invalidate token

---

## File Upload Strategy

### Image Upload Flow
1. **Client**: User selects images
2. **Client**: Compress/resize images (using browser APIs)
3. **Client**: Upload to server endpoint
4. **Server**: Validate file type and size
5. **Server**: Process image (optimize, generate thumbnails)
6. **Server**: Upload to storage (Cloudinary/S3)
7. **Server**: Return URLs
8. **Client**: Save URLs to database

### Image Sizes
- **Original**: Max 2000px width (for lightbox)
- **Thumbnail**: 400px width (for cards/galleries)
- **Cover**: 1200px width (for trip covers)

### Storage Options

**Option 1: Cloudinary (Recommended)**
- Pros: Automatic optimization, transformations, CDN
- Cons: Cost at scale
- Setup: Simple SDK integration

**Option 2: AWS S3**
- Pros: Cheap storage, scalable
- Cons: Need to handle optimization
- Setup: More complex, need CloudFront for CDN

**Option 3: Local Filesystem (Development only)**
- Pros: Free, simple
- Cons: Not scalable, no CDN
- Setup: Store in `/public/uploads`

---

## Route Configuration

React Router v7 uses code-based route configuration instead of file-based routing.

### Route Configuration File

```typescript
// app/routes.ts
import { type RouteConfig, route, layout, index } from "@react-router/dev/routes";

export default [
  // Public routes
  index("pages/home.tsx"),
  route("login", "pages/login.tsx"),
  route("register", "pages/register.tsx"),
  route("forgot-password", "pages/forgot-password.tsx"),
  route("reset-password/:token", "pages/reset-password.tsx"),
  
  // Authenticated routes with layout
  layout("components/layout/app-shell.tsx", [
    route("dashboard", "pages/dashboard.tsx"),
    
    // Profile routes
    route("profile", "pages/profile/profile.tsx"),
    route("profile/edit", "pages/profile/profile-edit.tsx"),
    
    // Trip routes
    route("trips/new", "pages/trips/trip-new.tsx"),
    route("trips/:tripId", "pages/trips/trip-detail.tsx"),
    route("trips/:tripId/edit", "pages/trips/trip-edit.tsx"),
    
    // Entry routes
    route("trips/:tripId/entries/new", "pages/trips/entry-new.tsx"),
    route("trips/:tripId/entries/:entryId", "pages/trips/entry-detail.tsx"),
    route("trips/:tripId/entries/:entryId/edit", "pages/trips/entry-edit.tsx"),
    
    // Expense routes
    route("trips/:tripId/expenses", "pages/trips/expenses.tsx"),
  ]),
  
  // Public trip views (Phase 2)
  route(":username", "pages/public/profile.tsx"),
  route(":username/:tripSlug", "pages/public/trip.tsx"),
  route(":username/:tripSlug/:entrySlug", "pages/public/entry.tsx"),
] satisfies RouteConfig;
```

### Example Page Component

```typescript
// app/pages/trips/trip-detail.tsx
import { json, LoaderFunctionArgs } from "@react-router/node";
import { useLoaderData, Link } from "react-router";
import { requireAuth } from "~/lib/auth.server";
import { db } from "~/lib/db.server";
import { TripHeader } from "~/components/trips/trip-header";
import { Timeline } from "~/components/entries/timeline";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  const { tripId } = params;
  
  const trip = await db.trip.findFirst({
    where: {
      id: tripId,
      userId: user.id,
    },
    include: {
      entries: {
        orderBy: { date: 'asc' },
      },
      expenses: true,
    },
  });
  
  if (!trip) {
    throw new Response("Trip not found", { status: 404 });
  }
  
  return json({ trip, user });
}

export default function TripDetail() {
  const { trip, user } = useLoaderData<typeof loader>();
  
  return (
    <div>
      <TripHeader trip={trip} />
      
      <div className="tabs">
        <button>Timeline</button>
        <button>Map</button>
        <button>Gallery</button>
        <button>Expenses</button>
      </div>
      
      <Timeline entries={trip.entries} />
      
      <Link to={`/trips/${trip.id}/entries/new`}>
        Add Entry
      </Link>
    </div>
  );
}
```

### Layout Component Example

```typescript
// app/components/layout/app-shell.tsx
import { json, LoaderFunctionArgs } from "@react-router/node";
import { Outlet, useLoaderData } from "react-router";
import { getUser } from "~/lib/auth.server";
import { Header } from "./header";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  return json({ user });
}

export default function AppShell() {
  const { user } = useLoaderData<typeof loader>();
  
  return (
    <div className="min-h-screen">
      <Header user={user} />
      
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
      
      <footer>
        {/* Footer content */}
      </footer>
    </div>
  );
}
```

---

## Data Fetching Patterns

### React Router Loaders

```typescript
// app/pages/trips/trip-detail.tsx
import { json, LoaderFunctionArgs } from "@react-router/node";
import { useLoaderData } from "react-router";
import { requireAuth } from "~/lib/auth.server";
import { db } from "~/lib/db.server";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  const { tripId } = params;
  
  const trip = await db.trip.findFirst({
    where: {
      id: tripId,
      userId: user.id,
    },
    include: {
      entries: {
        orderBy: { date: 'asc' },
      },
      expenses: true,
    },
  });
  
  if (!trip) {
    throw new Response("Trip not found", { status: 404 });
  }
  
  return json({ trip, user });
}

export default function TripDetail() {
  const { trip, user } = useLoaderData<typeof loader>();
  
  return (
    <div>
      <h1>{trip.title}</h1>
      {/* ... */}
    </div>
  );
}
```

### Actions (Form Submissions with Conform)

```typescript
// app/pages/trips/entry-new.tsx
import { ActionFunctionArgs, redirect } from "@react-router/node";
import { Form, useActionData } from "react-router";
import { parseWithZod } from "@conform-to/zod";
import { useForm } from "@conform-to/react";
import { z } from "zod";
import { db } from "~/lib/db.server";

const entrySchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  category: z.enum(["FOOD", "ACCOMMODATION", "ACTIVITY", "TRANSPORT", "REFLECTION", "OTHER"]),
  rating: z.coerce.number().min(1).max(5).optional(),
});

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireAuth(request);
  const { tripId } = params;
  
  const formData = await request.formData();
  const submission = parseWithZod(formData, { schema: entrySchema });
  
  if (submission.status !== "success") {
    return submission.reply();
  }
  
  const entry = await db.entry.create({
    data: {
      ...submission.value,
      date: new Date(submission.value.date),
      tripId,
      userId: user.id,
    },
  });
  
  return redirect(`/trips/${tripId}/entries/${entry.id}`);
}

export default function NewEntry() {
  const lastResult = useActionData<typeof action>();
  const [form, fields] = useForm({
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: entrySchema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
  });

  return (
    <Form method="post" id={form.id} onSubmit={form.onSubmit}>
      <div>
        <label htmlFor={fields.title.id}>Title</label>
        <input
          id={fields.title.id}
          name={fields.title.name}
          defaultValue={fields.title.initialValue}
        />
        <div>{fields.title.errors}</div>
      </div>
      
      <div>
        <label htmlFor={fields.content.id}>Content</label>
        <textarea
          id={fields.content.id}
          name={fields.content.name}
          defaultValue={fields.content.initialValue}
        />
        <div>{fields.content.errors}</div>
      </div>
      
      {/* More fields... */}
      
      <button type="submit">Create Entry</button>
    </Form>
  );
}
```

---

## Error Handling

### API Errors
```typescript
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
  }
}

// Usage
if (!trip) {
  throw new AppError(404, "Trip not found");
}
```

### Error Boundaries
```typescript
// app/root.tsx
import { useRouteError, isRouteErrorResponse, Links, Meta, Scripts, ScrollRestoration } from "react-router";

export function ErrorBoundary() {
  const error = useRouteError();
  
  if (isRouteErrorResponse(error)) {
    return (
      <html>
        <head>
          <title>Error {error.status}</title>
          <Meta />
          <Links />
        </head>
        <body>
          <div>
            <h1>{error.status} {error.statusText}</h1>
            <p>{error.data}</p>
          </div>
          <Scripts />
        </body>
      </html>
    );
  }
  
  return (
    <html>
      <head>
        <title>Unexpected Error</title>
        <Meta />
        <Links />
      </head>
      <body>
        <div>
          <h1>Unexpected Error</h1>
          <p>Something went wrong</p>
        </div>
        <Scripts />
      </body>
    </html>
  );
}
```

---

## Performance Optimization

### Database
- Index frequently queried fields
- Use `select` to limit fields returned
- Implement pagination for long lists
- Use database connection pooling

### Images
- Lazy load images
- Use responsive images (srcset)
- Compress before upload
- Use CDN for delivery
- Implement progressive loading (blur-up)

### Caching
- Cache public trip pages (SSR)
- Use React Query or SWR for client-side caching
- Browser caching headers for static assets
- Redis for session storage (production)

### Code Splitting
- Route-based code splitting (automatic with React Router)
- Lazy load heavy components (map, rich text editor)
- Use dynamic imports for optional features

---

## Security Considerations

### Authentication
- Store passwords with bcrypt (cost factor 12+)
- Use HTTPS in production
- HTTP-only, secure cookies for sessions
- CSRF protection
- Rate limiting on auth endpoints

### Authorization
- Verify user owns resource before allowing access
- Check permissions on every loader/action
- Don't expose other users' data

### Input Validation
- Validate all user input with Zod
- Sanitize HTML content
- Prevent SQL injection (use Prisma parameterized queries)
- Validate file uploads (type, size)

### Data Privacy
- Never expose email addresses publicly
- Strip EXIF data from uploaded photos
- Respect user privacy settings
- GDPR compliance (data export, deletion)

---

## Environment Variables

```bash
# .env.example

# Database
DATABASE_URL="file:./dev.db"

# Authentication
SESSION_SECRET="your-secret-key-change-this"
JWT_SECRET="your-jwt-secret"

# File Upload
# Local storage for development
UPLOAD_DIR="./public/uploads"

# Production: Cloudinary (optional)
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# Email
RESEND_API_KEY=""
FROM_EMAIL="noreply@traveljournal.com"

# App
NODE_ENV="development"
APP_URL="http://localhost:3000"

# Optional: Maps
MAPBOX_TOKEN=""
GOOGLE_MAPS_API_KEY=""

# Optional: Analytics
SENTRY_DSN=""
POSTHOG_API_KEY=""
```

---

## Development Workflow

### Setup
```bash
# Install dependencies
pnpm install

# Setup database
pnpm prisma generate
pnpm prisma migrate dev

# Seed database (optional)
pnpm prisma db seed

# Start dev server
pnpm dev
```

### Database Changes
```bash
# Create migration after schema changes
pnpm prisma migrate dev --name add_user_bio

# Reset database (WARNING: deletes data)
pnpm prisma migrate reset
```

### Code Quality
```bash
# Lint
pnpm lint

# Type check
pnpm typecheck

# Format
pnpm format

# Test
pnpm test
```

---

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Build succeeds locally
- [ ] All tests pass
- [ ] Environment secrets secured
- [ ] HTTPS configured
- [ ] Error tracking setup (Sentry)
- [ ] Analytics configured
- [ ] Backups configured for database
- [ ] CDN setup for images
- [ ] Domain configured
- [ ] Email sending works

---

## Monitoring & Maintenance

### Logging
- Log all errors to Sentry
- Log authentication attempts
- Log slow database queries
- Don't log sensitive data (passwords, tokens)

### Metrics to Track
- Response times
- Error rates
- Database query performance
- Image upload success rate
- User registration/login success
- Active users

### Backups
- Automated daily database backups
- Test restoration process
- Store backups offsite
- Retention policy (30 days)

---

## Future Considerations

### Scalability
- Separate API server if traffic grows
- Database read replicas
- CDN for all static assets
- Caching layer (Redis)
- Queue system for async tasks (image processing, emails)

### Features
- Real-time collaboration (WebSockets)
- Mobile apps (React Native)
- Offline support (PWA with service workers)
- AI features (image recognition, smart suggestions)
- Social features (follows, likes, comments)