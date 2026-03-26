import { redirect } from "react-router";
import type { Route } from "./+types/google-callback";
import { createUserSession } from "~/lib/auth.server";
import type { PrismaClient } from "@prisma/client";

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name?: string;
  picture: string;
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const { db } = context;

  // Google OAuth configuration - read from context env in Workers
  const GOOGLE_CLIENT_ID = context.cloudflare.env.GOOGLE_CLIENT_ID || "";
  const GOOGLE_CLIENT_SECRET = context.cloudflare.env.GOOGLE_CLIENT_SECRET || "";
  const GOOGLE_REDIRECT_URI =
    context.cloudflare.env.GOOGLE_REDIRECT_URI ||
    "http://localhost:8787/auth/google/callback";

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    throw redirect("/login?error=oauth_denied");
  }

  if (!code) {
    throw redirect("/login?error=oauth_no_code");
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw redirect("/login?error=oauth_not_configured");
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: GOOGLE_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange code for tokens");
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json();

    // Get user info from Google
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    if (!userInfoResponse.ok) {
      throw new Error("Failed to get user info");
    }

    const googleUser: GoogleUserInfo = await userInfoResponse.json();

    // Check if account exists
    const existingAccount = await db.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "google",
          providerAccountId: googleUser.id,
        },
      },
      include: { user: true },
    });

    if (existingAccount) {
      // User exists, create session
      return createUserSession(db, existingAccount.user.id, "/dashboard");
    }

    // Check if user with this email exists (to link accounts)
    const existingUser = await db.user.findUnique({
      where: { email: googleUser.email },
    });

    if (existingUser) {
      // Link Google account to existing user
      await db.account.create({
        data: {
          userId: existingUser.id,
          provider: "google",
          providerAccountId: googleUser.id,
        },
      });
      return createUserSession(db, existingUser.id, "/dashboard");
    }

    // Create new user with Google account
    const username = await generateUsername(
      db,
      googleUser.email,
      googleUser.given_name
    );
    const user = await db.user.create({
      data: {
        email: googleUser.email,
        username,
        displayName: googleUser.name,
        avatar: googleUser.picture,
        accounts: {
          create: {
            provider: "google",
            providerAccountId: googleUser.id,
          },
        },
      },
    });

    return createUserSession(db, user.id, "/dashboard");
  } catch (error) {
    console.error("Google OAuth error:", error);
    throw redirect("/login?error=oauth_failed");
  }
}

/**
 * Generate a unique username from email or name
 */
async function generateUsername(
  db: PrismaClient,
  email: string,
  name: string
): Promise<string> {
  // Try email prefix first
  let baseUsername = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");

  if (baseUsername.length < 3) {
    baseUsername = name.toLowerCase().replace(/[^a-z0-9_-]/g, "");
  }

  // Ensure minimum length
  if (baseUsername.length < 3) {
    baseUsername = "user";
  }

  // Check if username exists and add number if needed
  let username = baseUsername;
  let counter = 1;

  while (await db.user.findUnique({ where: { username } })) {
    username = `${baseUsername}${counter}`;
    counter++;
  }

  return username;
}

export default function GoogleCallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Authenticating with Google...</p>
    </div>
  );
}
