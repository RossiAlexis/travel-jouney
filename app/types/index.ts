export type {
  EntryCategory,
  ExpenseCategory,
  TripStatus,
  Account,
  DashboardTrip,
  Entry,
  Expense,
  Photo,
  Session,
  Trip,
  User,
} from "~/lib/schemas";
import type { EntryWithPhotos, Expense, Trip } from "~/lib/schemas";

// App-specific types
export interface SessionUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar: string | null;
}

export interface TripWithEntries extends Trip {
  entries: EntryWithPhotos[];
}

export interface TripWithAll extends Trip {
  entries: EntryWithPhotos[];
  expenses: Expense[];
  entriesCount: number;
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

