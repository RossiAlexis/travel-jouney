import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { apiRequest, storeRefreshToken, clearRefreshToken } from "../services/api";

export interface SessionUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar: string | null;
}

const TOKEN_KEY = "auth_token";

interface AuthState {
  token: string | null;
  user: SessionUser | null;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    username: string,
    displayName: string,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  /** Update the in-memory access token (called after a silent token refresh). */
  updateToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isLoading: false,
  isInitialized: false,

  updateToken: (token: string) => {
    // Persist to SecureStore so the next app launch picks it up too
    SecureStore.setItemAsync(TOKEN_KEY, token).catch(() => {});
    set({ token });
  },

  initialize: async () => {
    set({ isLoading: true });
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!token) {
        set({ isInitialized: true });
        return;
      }

      const data = await apiRequest<{ user: SessionUser }>(
        "/api/auth/me",
        {},
        token,
        (newToken) => get().updateToken(newToken),
      );
      set({ token, user: data.user, isInitialized: true });
    } catch {
      // Token invalid or expired — clear everything
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await clearRefreshToken();
      set({ token: null, user: null, isInitialized: true });
    } finally {
      set({ isLoading: false });
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true });
    try {
      const data = await apiRequest<{
        token: string;
        refreshToken: string;
        user: SessionUser;
      }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      await SecureStore.setItemAsync(TOKEN_KEY, data.token);
      if (data.refreshToken) {
        await storeRefreshToken(data.refreshToken);
      }
      set({ token: data.token, user: data.user });
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (email, password, username, displayName) => {
    set({ isLoading: true });
    try {
      const data = await apiRequest<{
        token: string;
        refreshToken: string;
        user: SessionUser;
      }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, username, displayName }),
      });
      await SecureStore.setItemAsync(TOKEN_KEY, data.token);
      if (data.refreshToken) {
        await storeRefreshToken(data.refreshToken);
      }
      set({ token: data.token, user: data.user });
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await clearRefreshToken();
      set({ token: null, user: null });
    } finally {
      set({ isLoading: false });
    }
  },
}));
