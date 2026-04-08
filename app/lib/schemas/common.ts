import { z } from "zod";

export const tripStatusSchema = z.enum(["PLANNED", "ONGOING", "COMPLETED"]);

export const memoryCategorySchema = z.enum([
  "ACCOMMODATION",
  "FOOD",
  "ACTIVITY",
  "TRANSPORT",
  "REFLECTION",
  "OTHER",
]);

export const expenseCategorySchema = z.enum([
  "ACCOMMODATION",
  "FOOD",
  "TRANSPORT",
  "ACTIVITIES",
  "SHOPPING",
  "OTHER",
]);

export type TripStatus = z.infer<typeof tripStatusSchema>;
export type MemoryCategory = z.infer<typeof memoryCategorySchema>;
export type ExpenseCategory = z.infer<typeof expenseCategorySchema>;

export const sqliteDateSchema = z
  .union([z.string(), z.date(), z.number()])
  .transform((value) => new Date(value))
  .refine((value) => !Number.isNaN(value.getTime()), {
    message: "Invalid date value from database",
  });

export const sqliteBooleanSchema = z
  .union([z.boolean(), z.number().int().min(0).max(1)])
  .transform((value) => (typeof value === "boolean" ? value : value === 1));
