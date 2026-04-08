import { z } from "zod";
import { expenseCategorySchema, sqliteDateSchema } from "./common";

export const expenseSchema = z.object({
  id: z.string(),
  tripId: z.string(),
  userId: z.string(),
  memoryId: z.string().nullable(),
  amount: z.number(),
  currency: z.string(),
  category: expenseCategorySchema,
  description: z.string(),
  date: sqliteDateSchema,
  createdAt: sqliteDateSchema,
  updatedAt: sqliteDateSchema,
});

export type Expense = z.infer<typeof expenseSchema>;
