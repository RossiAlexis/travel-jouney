import { createCookieSessionStorage } from "react-router";

type SessionData = { userId: string };

// Lazy-initialized session storage so the secret can be set at runtime.
// Cloudflare Workers only expose secrets via env in the fetch handler,
// not at module init time. workers/app.ts sets process.env.SESSION_SECRET
// before the first request is handled.
let _sessionStorage: ReturnType<
  typeof createCookieSessionStorage<SessionData>
> | null = null;

function getStorage() {
  if (_sessionStorage) return _sessionStorage;

  const secret =
    process.env.SESSION_SECRET || "dev-secret-change-in-production";

  if (
    process.env.NODE_ENV === "production" &&
    secret === "dev-secret-change-in-production"
  ) {
    console.warn(
      "WARNING: Using default session secret in production. Set SESSION_SECRET."
    );
  }

  _sessionStorage = createCookieSessionStorage<SessionData>({
    cookie: {
      name: "__travel_journal_session",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
      sameSite: "lax",
      secrets: [secret],
      secure: process.env.NODE_ENV === "production",
    },
  });

  return _sessionStorage;
}

export function getSession(cookie?: string | null) {
  return getStorage().getSession(cookie);
}

export function commitSession(
  ...args: Parameters<
    ReturnType<typeof createCookieSessionStorage<SessionData>>["commitSession"]
  >
) {
  return getStorage().commitSession(...args);
}

export function destroySession(
  ...args: Parameters<
    ReturnType<typeof createCookieSessionStorage<SessionData>>["destroySession"]
  >
) {
  return getStorage().destroySession(...args);
}
