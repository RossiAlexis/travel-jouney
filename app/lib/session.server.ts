import { createCookieSessionStorage } from "react-router";

// Session secret should be set in environment variables
const sessionSecret =
  process.env.SESSION_SECRET || "dev-secret-change-in-production";

if (
  process.env.NODE_ENV === "production" &&
  sessionSecret === "dev-secret-change-in-production"
) {
  console.warn(
    "WARNING: Using default session secret in production. Set SESSION_SECRET environment variable."
  );
}

// Create session storage with secure cookie settings
const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__travel_journal_session",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
    sameSite: "lax",
    secrets: [sessionSecret],
    secure: process.env.NODE_ENV === "production",
  },
});

export const { getSession, commitSession, destroySession } = sessionStorage;
