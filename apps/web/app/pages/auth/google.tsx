import { redirect } from "react-router";
import type { Route } from "./+types/google";

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI || "http://localhost:5173/auth/google/callback";

export async function loader({}: Route.LoaderArgs) {
  if (!GOOGLE_CLIENT_ID) {
    // Google OAuth not configured, redirect to login with error
    throw redirect("/login?error=oauth_not_configured");
  }

  // Build Google OAuth authorization URL
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  throw redirect(authUrl);
}

export default function GoogleAuth() {
  // This component should never render as the loader always redirects
  return null;
}

