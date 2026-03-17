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
    route("trips/:tripId/export/json", "pages/trips/trip-export.tsx"),
    route("trips/:tripId", "pages/trips/trip-detail.tsx"),
    route("trips/:tripId/edit", "pages/trips/trip-edit.tsx"),

    // Memory routes (nested under trips)
    route("trips/:tripId/memories/new", "pages/trips/memory-new.tsx"),
    route("trips/:tripId/memories/:memoryId", "pages/trips/memory-detail.tsx"),
    route("trips/:tripId/memories/:memoryId/edit", "pages/trips/memory-edit.tsx"),

    // Expenses view
    route("trips/:tripId/expenses", "pages/trips/expenses.tsx"),
  ]),

  // API resource routes — mobile JSON API (Bearer JWT auth)
  route("api/auth/login", "routes/api.auth.login.ts"),
  route("api/auth/register", "routes/api.auth.register.ts"),
  route("api/auth/refresh", "routes/api.auth.refresh.ts"),
  route("api/auth/logout", "routes/api.auth.logout.ts"),
  route("api/auth/me", "routes/api.auth.me.ts"),

  // Trips API
  route("api/trips", "routes/api.trips.ts"),
  route("api/trips/:tripId", "routes/api.trips.$tripId.ts"),
  route("api/trips/:tripId/stats", "routes/api.trips.$tripId.stats.ts"),
  route("api/trips/:tripId/export/json", "routes/api.trips.$tripId.export.json.ts"),

  // Public profile and trip views
  route(":username", "pages/public/user-profile.tsx"),
  route(":username/:tripSlug", "pages/public/trip-public.tsx"),
  route(":username/:tripSlug/:memorySlug", "pages/public/memory-public.tsx"),
] satisfies RouteConfig;
