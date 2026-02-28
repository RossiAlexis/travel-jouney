import { useAuthStore } from "../stores/authStore";

/**
 * Hook for accessing auth state and actions.
 * Thin wrapper over the Zustand store — business logic stays in the store.
 */
export function useAuth() {
  const session = useAuthStore((s) => s.session);
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const signOut = useAuthStore((s) => s.signOut);
  const initialize = useAuthStore((s) => s.initialize);

  return {
    session,
    user,
    isLoading,
    isInitialized,
    isAuthenticated: !!session,
    signIn,
    signUp,
    signOut,
    initialize,
  };
}
