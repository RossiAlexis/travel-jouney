import {
  type RouteConfig,
  index,
  route,
  layout,
} from "@react-router/dev/routes";

export default [
  // Public routes
  index("routes/home.tsx"),
  route("login", "pages/auth/login.tsx"),
  route("register", "pages/auth/register.tsx"),
  route("forgot-password", "pages/auth/forgot-password.tsx"),
  route("reset-password/:token", "pages/auth/reset-password.tsx"),

  // Google OAuth callback
  route("auth/google", "pages/auth/google.tsx"),
  route("auth/google/callback", "pages/auth/google-callback.tsx"),

  // Logout route
  route("logout", "pages/auth/logout.tsx"),

  // Authenticated routes with app shell layout
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

    // Memory routes (nested under trips)
    route("trips/:tripId/memories/new", "pages/trips/memory-new.tsx"),
    route("trips/:tripId/memories/:memoryId", "pages/trips/memory-detail.tsx"),
    route("trips/:tripId/memories/:memoryId/edit", "pages/trips/memory-edit.tsx"),

    // Destination routes
    route("trips/:tripId/destinations/new", "pages/trips/destination-new.tsx"),
    route("trips/:tripId/destinations/:destinationId", "pages/trips/destination-detail.tsx"),
    route("trips/:tripId/destinations/:destinationId/edit", "pages/trips/destination-edit.tsx"),
    route("trips/:tripId/destinations/:destinationId/memories/new", "pages/trips/destination-memory-new.tsx"),

    // Expenses view
    route("trips/:tripId/expenses", "pages/trips/expenses.tsx"),
  ]),

  // Public profile and trip views (Phase 2)
  // route(":username", "pages/public/user-profile.tsx"),
  // route(":username/:tripSlug", "pages/public/trip-public.tsx"),
  // route(":username/:tripSlug/:memorySlug", "pages/public/memory-public.tsx"),
] satisfies RouteConfig;
