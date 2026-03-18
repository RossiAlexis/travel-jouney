import * as SecureStore from "expo-secure-store";

// Points to the web server (React Router v7) which exposes /api/* routes
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5173";

const REFRESH_TOKEN_KEY = "auth_refresh_token";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ---------------------------------------------------------------------------
// Refresh-token helpers
// ---------------------------------------------------------------------------

export async function storeRefreshToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
}

export async function getStoredRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function clearRefreshToken(): Promise<void> {
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

let refreshPromise: Promise<string | null> | null = null;

/**
 * Attempt to exchange the stored refresh token for a new access token.
 * Returns the new access token on success, or null on failure (in which case
 * the stored refresh token is also cleared).
 *
 * Concurrent callers share the same in-flight promise to avoid race conditions
 * where multiple 401s trigger parallel refresh attempts.
 */
export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const refreshToken = await getStoredRefreshToken();
      if (!refreshToken) return null;

      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        await clearRefreshToken();
        return null;
      }

      const data = (await response.json()) as {
        token?: string;
        refreshToken?: string;
      };

      // Rotate the refresh token if the server sends a new one
      if (data.refreshToken) {
        try {
          await storeRefreshToken(data.refreshToken);
        } catch {
          // SecureStore write failed — warn but don't fail the refresh
          // The new access token is still valid for this session
          console.warn("[auth] Failed to persist new refresh token to SecureStore");
        }
      }

      return data.token ?? null;
    } catch {
      return null;
    } finally {
      refreshPromise = null; // clear so future calls can retry
    }
  })();

  return refreshPromise;
}

// ---------------------------------------------------------------------------
// Core request helper
// ---------------------------------------------------------------------------

/**
 * Make an authenticated API request.
 *
 * On a 401 response the function will automatically attempt a token refresh
 * and retry the request once with the new access token. If the refresh also
 * fails the original ApiError is re-thrown so callers (and the auth store)
 * can handle the forced sign-out.
 *
 * Pass `onTokenRefreshed` to receive the new access token so the auth store
 * can keep its in-memory state in sync.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
  onTokenRefreshed?: (newToken: string) => void,
): Promise<T> {
  const buildHeaders = (accessToken?: string | null): Record<string, string> => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return headers;
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: buildHeaders(token),
  });

  // On 401, attempt a silent token refresh and retry once
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      onTokenRefreshed?.(newToken);

      const retryResponse = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: buildHeaders(newToken),
      });

      const retryData = (await retryResponse.json()) as T & { error?: string };
      if (!retryResponse.ok) {
        throw new ApiError(
          retryResponse.status,
          retryData.error ?? `Request failed with status ${retryResponse.status}`,
        );
      }
      return retryData;
    }
    // Refresh failed — fall through to throw the original 401
    const errorData = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new ApiError(
      response.status,
      errorData.error ?? `Request failed with status ${response.status}`,
    );
  }

  const data = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data.error ?? `Request failed with status ${response.status}`,
    );
  }

  return data;
}
