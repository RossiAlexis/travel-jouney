import { Redirect } from "expo-router";
import { useAuthStore } from "../src/stores/authStore";

/**
 * Entry point — redirects to the appropriate route based on auth state.
 * Auth initialization happens in _layout.tsx before this renders.
 */
export default function Index() {
  const session = useAuthStore((s) => s.session);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  if (!isInitialized) {
    return null;
  }

  if (session) {
    return <Redirect href="/(app)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
