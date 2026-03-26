// Re-export Prisma types for use throughout the app
export type {
  User,
  Account,
  Session,
  Trip,
  Entry,
  Photo,
  Expense,
  TripStatus,
  EntryCategory,
  ExpenseCategory,
} from "../generated/prisma";

// App-specific types
export interface SessionUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar: string | null;
}

export interface TripWithCounts extends Trip {
  _count: {
    entries: number;
    expenses: number;
  };
}

export interface EntryWithPhotos extends Entry {
  photos: Photo[];
}

export interface TripWithEntries extends Trip {
  entries: EntryWithPhotos[];
}

export interface TripWithAll extends Trip {
  entries: EntryWithPhotos[];
  expenses: Expense[];
  _count: {
    entries: number;
    expenses: number;
  };
}

// Form action results
export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}

// Import the actual types to re-export
import type { Trip, Entry, Photo, Expense } from "../generated/prisma";

