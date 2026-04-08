export type {
  MemoryCategory,
  ExpenseCategory,
  TripStatus,
  Account,
  DashboardTrip,
  Memory,
  Expense,
  Photo,
  Session,
  Trip,
  User,
} from "~/lib/schemas";
import type { MemoryWithPhotos, Expense, Trip } from "~/lib/schemas";

// App-specific types
export interface SessionUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar: string | null;
}

export interface TripWithMemories extends Trip {
  memories: MemoryWithPhotos[];
}

export interface TripWithAll extends Trip {
  memories: MemoryWithPhotos[];
  expenses: Expense[];
  memoriesCount: number;
  expensesCount: number;
  totalExpenses: number;
}

// Form action results
export interface ActionResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}
