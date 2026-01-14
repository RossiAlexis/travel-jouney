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

    // Entry routes (nested under trips)
    route("trips/:tripId/entries/new", "pages/trips/entry-new.tsx"),
    route("trips/:tripId/entries/:entryId", "pages/trips/entry-detail.tsx"),
    route("trips/:tripId/entries/:entryId/edit", "pages/trips/entry-edit.tsx"),

    // Expenses view
    route("trips/:tripId/expenses", "pages/trips/expenses.tsx"),
  ]),

  // Public profile and trip views (Phase 2)
  // route(":username", "pages/public/user-profile.tsx"),
  // route(":username/:tripSlug", "pages/public/trip-public.tsx"),
  // route(":username/:tripSlug/:entrySlug", "pages/public/entry-public.tsx"),
] satisfies RouteConfig;
