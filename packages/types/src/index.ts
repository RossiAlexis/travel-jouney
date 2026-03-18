// Re-export canonical types from @repo/db (Prisma-generated)
// This ensures types always match the database schema
export type { Trip, Memory, Expense, User } from "@repo/db";
// Re-export Prisma enums
export { TripStatus, MemoryCategory, ExpenseCategory } from "@repo/db";

// Location is an app-specific type not backed by a Prisma model
export type { Location } from "./location.js";
