import { createClient } from "@supabase/supabase-js";
import type { Trip, Memory, User, Location } from "@repo/types";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase environment variables. " +
      "Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY in your .env file.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Typed database schema aligned with @repo/types domain models.
 * Mirrors the Prisma schema in apps/web/prisma/schema.prisma.
 */
export type Database = {
  public: {
    Tables: {
      User: {
        Row: User;
        Insert: Omit<User, "id" | "createdAt" | "updatedAt">;
        Update: Partial<Omit<User, "id" | "createdAt" | "updatedAt">>;
      };
      Trip: {
        Row: Trip;
        Insert: Omit<Trip, "id" | "createdAt" | "updatedAt">;
        Update: Partial<Omit<Trip, "id" | "createdAt" | "updatedAt">>;
      };
      Memory: {
        Row: Memory;
        Insert: Omit<Memory, "id" | "createdAt" | "updatedAt">;
        Update: Partial<Omit<Memory, "id" | "createdAt" | "updatedAt">>;
      };
      Location: {
        Row: Location;
        Insert: Omit<Location, "id">;
        Update: Partial<Omit<Location, "id">>;
      };
    };
  };
};
