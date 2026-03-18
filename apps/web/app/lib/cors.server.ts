/**
 * CORS configuration for API routes.
 *
 * Allowed origins (in priority order):
 *  1. CORS_ORIGIN env var — comma-separated list for production
 *  2. http://localhost:5173   — web dev server (Vite)
 *  3. http://localhost:8081   — Expo Metro bundler
 *  4. http://localhost:19006  — Expo web
 *  5. exp://*                 — Expo native scheme
 */

const ALWAYS_ALLOWED: ReadonlyArray<string> = [
  "http://localhost:5173",
  "http://localhost:8081",
  "http://localhost:19006",
];

function getAllowedOrigins(): string[] {
  const envOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean)
    : [];
  return [...envOrigins, ...ALWAYS_ALLOWED];
}

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  // Allow the Expo native scheme (exp://...)
  if (origin.startsWith("exp://")) return true;
  return getAllowedOrigins().includes(origin);
}

/**
 * Returns CORS headers for the given request's `Origin`.
 * If the origin is not recognised, returns an empty object so browsers block the request.
 */
export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("Origin");
  if (!isAllowedOrigin(origin)) {
    return {};
  }

  return {
    "Access-Control-Allow-Origin": origin as string,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

/**
 * Handle a CORS preflight (OPTIONS) request.
 *
 * @returns A 204 `Response` for OPTIONS requests, `null` for all other methods.
 */
export function handleCorsPreflightRequest(request: Request): Response | null {
  if (request.method !== "OPTIONS") return null;

  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}
