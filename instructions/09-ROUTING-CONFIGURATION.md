# Routing Configuration Guide

## Overview
This guide explains how to configure routes in the Travel Journal application using React Router v7's code-based routing system (not file-based routing).

## Why Code-Based Routing?

**Advantages:**
- **Explicit control**: Clear, centralized route configuration
- **Type safety**: Better TypeScript inference
- **Flexibility**: Easy to reorganize files without breaking routes
- **Co-location**: Components can be organized by feature, not by route structure
- **Easier testing**: Routes are just data structures

---

## Route Configuration File

All routes are defined in a single configuration file:

```typescript
// app/routes.ts
import { type RouteConfig, route, layout, index, prefix } from "@react-router/dev/routes";

export default [
  // Landing page
  index("pages/home.tsx"),
  
  // Authentication routes
  route("login", "pages/auth/login.tsx"),
  route("register", "pages/auth/register.tsx"),
  route("forgot-password", "pages/auth/forgot-password.tsx"),
  route("reset-password/:token", "pages/auth/reset-password.tsx"),
  
  // Authenticated routes wrapped in layout
  layout("components/layout/app-shell.tsx", [
    // Dashboard
    route("dashboard", "pages/dashboard.tsx"),
    
    // Profile routes
    route("profile", "pages/profile/profile.tsx"),
    route("profile/edit", "pages/profile/profile-edit.tsx"),
    
    // Trip routes
    route("trips/new", "pages/trips/trip-new.tsx"),
    route("trips/:tripId", "pages/trips/trip-detail.tsx"),
    route("trips/:tripId/edit", "pages/trips/trip-edit.tsx"),
    
    // Entry routes (nested under trips)
    route("trips/:tripId/entries/new", "pages/trips/entry-new.tsx"),
    route("trips/:tripId/entries/:entryId", "pages/trips/entry-detail.tsx"),
    route("trips/:tripId/entries/:entryId/edit", "pages/trips/entry-edit.tsx"),
    
    // Expenses view (integrated in trip detail, but can have dedicated route)
    route("trips/:tripId/expenses", "pages/trips/expenses.tsx"),
  ]),
  
  // Public routes (Phase 2 - no auth required)
  route(":username", "pages/public/user-profile.tsx"),
  route(":username/:tripSlug", "pages/public/trip-public.tsx"),
  route(":username/:tripSlug/:entrySlug", "pages/public/entry-public.tsx"),
] satisfies RouteConfig;
```

---

## Route Types

### 1. Index Route

The root path (`/`):

```typescript
index("pages/home.tsx")
```

### 2. Simple Route

Static or dynamic paths:

```typescript
route("login", "pages/auth/login.tsx")
route("trips/:tripId", "pages/trips/trip-detail.tsx")
```

### 3. Layout Route

Wraps child routes with a layout component:

```typescript
layout("components/layout/app-shell.tsx", [
  route("dashboard", "pages/dashboard.tsx"),
  route("profile", "pages/profile/profile.tsx"),
  // ... more routes
])
```

### 4. Prefix Routes

Group routes under a common prefix:

```typescript
...prefix("admin", [
  route("users", "pages/admin/users.tsx"),
  route("settings", "pages/admin/settings.tsx"),
])
```

---

## Page Components

Each route points to a page component that exports:
- `default` - The component to render
- `loader` (optional) - Server-side data loading
- `action` (optional) - Server-side form handling
- `ErrorBoundary` (optional) - Error handling

### Basic Page Component

```typescript
// app/pages/dashboard.tsx
import { json, LoaderFunctionArgs } from "@react-router/node";
import { useLoaderData, Link } from "react-router";
import { requireAuth } from "~/lib/auth.server";
import { db } from "~/lib/db.server";

// Server-side data loading
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  
  const trips = await db.trip.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });
  
  return json({ user, trips });
}

// Component
export default function Dashboard() {
  const { user, trips } = useLoaderData<typeof loader>();
  
  return (
    <div>
      <h1>Welcome, {user.displayName}</h1>
      
      <div className="grid grid-cols-3 gap-4">
        {trips.map(trip => (
          <Link key={trip.id} to={`/trips/${trip.id}`}>
            <TripCard trip={trip} />
          </Link>
        ))}
      </div>
      
      <Link to="/trips/new">Create New Trip</Link>
    </div>
  );
}
```

### Page with Action (Form Handling)

```typescript
// app/pages/trips/trip-new.tsx
import { ActionFunctionArgs, redirect } from "@react-router/node";
import { Form, useActionData } from "react-router";
import { parseWithZod } from "@conform-to/zod";
import { useForm } from "@conform-to/react";
import { tripSchema } from "~/lib/validations";
import { requireAuth } from "~/lib/auth.server";
import { db } from "~/lib/db.server";

// Server-side form handling
export async function action({ request }: ActionFunctionArgs) {
  const user = await requireAuth(request);
  const formData = await request.formData();
  
  const submission = parseWithZod(formData, { schema: tripSchema });
  
  if (submission.status !== "success") {
    return submission.reply();
  }
  
  const trip = await db.trip.create({
    data: {
      ...submission.value,
      userId: user.id,
    },
  });
  
  return redirect(`/trips/${trip.id}`);
}

// Component
export default function NewTrip() {
  const lastResult = useActionData<typeof action>();
  
  const [form, fields] = useForm({
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: tripSchema });
    },
  });
  
  return (
    <div>
      <h1>Create New Trip</h1>
      
      <Form method="post" id={form.id} onSubmit={form.onSubmit}>
        <input name={fields.title.name} placeholder="Trip title" />
        {fields.title.errors && <div>{fields.title.errors}</div>}
        
        {/* More fields... */}
        
        <button type="submit">Create Trip</button>
      </Form>
    </div>
  );
}
```

---

## Layout Components

Layouts wrap multiple routes and provide shared UI (header, sidebar, etc.).

```typescript
// app/components/layout/app-shell.tsx
import { json, LoaderFunctionArgs } from "@react-router/node";
import { Outlet, useLoaderData } from "react-router";
import { requireAuth } from "~/lib/auth.server";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

// Layout can have its own loader
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request);
  return json({ user });
}

export default function AppShell() {
  const { user } = useLoaderData<typeof loader>();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      
      <div className="flex flex-1">
        <Sidebar user={user} />
        
        <main className="flex-1 p-8">
          {/* Child routes render here */}
          <Outlet />
        </main>
      </div>
      
      <footer className="bg-gray-100 p-4">
        <p>© 2024 Travel Journal</p>
      </footer>
    </div>
  );
}
```

---

## Route Parameters

### Accessing Parameters in Loaders

```typescript
export async function loader({ params }: LoaderFunctionArgs) {
  const { tripId, entryId } = params;
  
  const entry = await db.entry.findUnique({
    where: { id: entryId },
    include: { trip: true },
  });
  
  return json({ entry });
}
```

### Accessing Parameters in Components

```typescript
import { useParams } from "react-router";

export default function EntryDetail() {
  const { tripId, entryId } = useParams();
  const { entry } = useLoaderData<typeof loader>();
  
  return <div>Entry: {entryId}</div>;
}
```

---

## Navigation

### Link Component

```typescript
import { Link } from "react-router";

<Link to="/trips/new">Create Trip</Link>
<Link to={`/trips/${trip.id}`}>View Trip</Link>
<Link to={`/trips/${trip.id}/edit`}>Edit Trip</Link>
```

### Programmatic Navigation

```typescript
import { useNavigate } from "react-router";

function MyComponent() {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate(`/trips/${tripId}`);
  };
  
  return <button onClick={handleClick}>Go to Trip</button>;
}
```

### Navigation from Actions

```typescript
import { redirect } from "@react-router/node";

export async function action({ request }: ActionFunctionArgs) {
  // ... handle form
  
  return redirect("/dashboard");
}
```

---

## Protected Routes

Implement authentication checks in loaders:

```typescript
// app/lib/auth.server.ts
import { redirect } from "@react-router/node";
import { getSession } from "./session.server";

export async function requireAuth(request: Request) {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");
  
  if (!userId) {
    throw redirect("/login");
  }
  
  const user = await db.user.findUnique({ where: { id: userId } });
  
  if (!user) {
    throw redirect("/login");
  }
  
  return user;
}

export async function getUser(request: Request) {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");
  
  if (!userId) return null;
  
  return db.user.findUnique({ where: { id: userId } });
}
```

### Using in Routes

```typescript
// Protected route
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireAuth(request); // Redirects if not authenticated
  // ... continue
}

// Optional auth (for layouts)
export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request); // Returns null if not authenticated
  return json({ user });
}
```

---

## Error Handling

### Route-Level Error Boundaries

```typescript
// app/pages/trips/trip-detail.tsx
import { useRouteError, isRouteErrorResponse } from "react-router";

export function ErrorBoundary() {
  const error = useRouteError();
  
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return <div>Trip not found</div>;
    }
    
    if (error.status === 403) {
      return <div>You don't have access to this trip</div>;
    }
  }
  
  return <div>Something went wrong</div>;
}
```

### Throwing Errors in Loaders

```typescript
export async function loader({ params }: LoaderFunctionArgs) {
  const trip = await db.trip.findUnique({ where: { id: params.tripId } });
  
  if (!trip) {
    throw new Response("Trip not found", { status: 404 });
  }
  
  return json({ trip });
}
```

---

## Advanced Patterns

### Nested Layouts

```typescript
export default [
  layout("components/layout/app-shell.tsx", [
    route("dashboard", "pages/dashboard.tsx"),
    
    // Nested layout for trip-specific pages
    layout("components/layout/trip-layout.tsx", [
      route("trips/:tripId", "pages/trips/trip-detail.tsx"),
      route("trips/:tripId/entries", "pages/trips/entries.tsx"),
      route("trips/:tripId/expenses", "pages/trips/expenses.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
```

### Optional Segments

```typescript
// Both /trips and /trips/archived will work
route("trips/:filter?", "pages/trips/list.tsx")
```

### Splat Routes (Catch-all)

```typescript
// Matches /docs/anything/here
route("docs/*", "pages/docs.tsx")
```

### Route Prefixes

```typescript
...prefix("api", [
  route("trips", "api/trips.ts"),
  route("entries", "api/entries.ts"),
])

// Results in /api/trips and /api/entries
```

---

## Route Organization Best Practices

### 1. Group by Feature

```
app/
├── pages/
│   ├── auth/          # All auth pages
│   ├── trips/         # All trip-related pages
│   ├── profile/       # Profile pages
│   └── public/        # Public-facing pages
```

### 2. Co-locate Related Code

Keep components, utilities, and types near the pages that use them:

```
app/
├── pages/
│   ├── trips/
│   │   ├── trip-detail.tsx
│   │   ├── trip-new.tsx
│   │   ├── components/      # Trip-specific components
│   │   └── utils.ts         # Trip-specific utilities
```

### 3. Separate Concerns

- **Pages**: Route handlers (loaders, actions, components)
- **Components**: Reusable UI components
- **Lib**: Shared utilities, database, auth

---

## Route Configuration Examples

### Simple App

```typescript
export default [
  index("pages/home.tsx"),
  route("about", "pages/about.tsx"),
  route("contact", "pages/contact.tsx"),
] satisfies RouteConfig;
```

### With Authentication

```typescript
export default [
  // Public
  index("pages/home.tsx"),
  route("login", "pages/login.tsx"),
  
  // Protected
  layout("components/layout/app-shell.tsx", [
    route("dashboard", "pages/dashboard.tsx"),
    route("settings", "pages/settings.tsx"),
  ]),
] satisfies RouteConfig;
```

### Full Application

```typescript
export default [
  // Public routes
  index("pages/home.tsx"),
  route("login", "pages/auth/login.tsx"),
  route("register", "pages/auth/register.tsx"),
  
  // Authenticated routes
  layout("components/layout/app-shell.tsx", [
    route("dashboard", "pages/dashboard.tsx"),
    
    // Trips with nested routes
    route("trips/new", "pages/trips/trip-new.tsx"),
    
    layout("components/layout/trip-layout.tsx", [
      route("trips/:tripId", "pages/trips/trip-detail.tsx"),
      route("trips/:tripId/edit", "pages/trips/trip-edit.tsx"),
      route("trips/:tripId/entries/new", "pages/trips/entry-new.tsx"),
      route("trips/:tripId/entries/:entryId", "pages/trips/entry-detail.tsx"),
    ]),
  ]),
  
  // Public profiles (Phase 2)
  route(":username", "pages/public/profile.tsx"),
  route(":username/:tripSlug", "pages/public/trip.tsx"),
] satisfies RouteConfig;
```

---

## Migration from File-Based Routing

If you see examples with file-based routing, here's how to convert:

| File-Based | Code-Based |
|------------|------------|
| `routes/_index.tsx` | `index("pages/home.tsx")` |
| `routes/about.tsx` | `route("about", "pages/about.tsx")` |
| `routes/trips.$id.tsx` | `route("trips/:id", "pages/trips/detail.tsx")` |
| `routes/_auth.login.tsx` | `layout("layouts/auth.tsx", [route("login", "pages/login.tsx")])` |

---

## Testing Routes

```typescript
// tests/routes.test.ts
import routes from "~/routes";

describe("Route Configuration", () => {
  it("should have home route", () => {
    const homeRoute = routes.find(r => r.path === "/");
    expect(homeRoute).toBeDefined();
  });
  
  it("should protect dashboard", async () => {
    // Test that dashboard loader requires auth
  });
});
```

---

## Summary

**Key Points:**
- Routes are configured in `app/routes.ts`
- Each route points to a page component file
- Pages can export `loader`, `action`, and `ErrorBoundary`
- Layouts wrap multiple routes with shared UI
- Use `requireAuth` in loaders to protect routes
- Navigation with `Link` and `useNavigate`
- Type-safe parameters with TypeScript

This approach gives you full control over routing while keeping your codebase organized and maintainable.