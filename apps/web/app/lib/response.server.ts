/**
 * Centralised API response helpers.
 *
 * Replaces the copy-pasted `function json<T>` that lived in every API route file.
 * Optionally merges CORS headers when a `request` is provided.
 */

import { getCorsHeaders, handleCorsPreflightRequest as _handleCorsPreflightRequest } from "~/lib/cors.server";

/**
 * Build a JSON `Response` with the correct `Content-Type` header.
 * When `request` is supplied, CORS headers are automatically included.
 *
 * @param data    The value to serialise as JSON.
 * @param status  HTTP status code (default 200).
 * @param request Optional originating request — used to derive CORS headers.
 */
export function apiResponse<T>(data: T, status = 200, request?: Request): Response {
  const corsHeaders = request ? getCorsHeaders(request) : {};
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

/**
 * Re-export for convenience so callers only need to import from this module.
 */
export { handleCorsPreflightRequest } from "~/lib/cors.server";
