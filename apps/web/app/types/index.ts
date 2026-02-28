// Re-export Prisma types for use throughout the app
export type {
  User,
  Account,
  Session,
  Trip,
  Memory,
  Photo,
  Expense,
  TripStatus,
  MemoryCategory,
  ExpenseCategory,
} from "@prisma/client";

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
    memories: number;
    expenses: number;
  };
}

export interface MemoryWithPhotos extends Memory {
  photos: Photo[];
}

export interface TripWithMemories extends Trip {
  memories: MemoryWithPhotos[];
}

export interface TripWithAll extends Trip {
  memories: MemoryWithPhotos[];
  expenses: Expense[];
  _count: {
    memories: number;
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
import type { Trip, Memory, Photo, Expense } from "@prisma/client";
