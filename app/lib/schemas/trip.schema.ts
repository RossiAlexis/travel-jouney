import { z } from "zod";
import {
  sqliteBooleanSchema,
  sqliteDateSchema,
  tripStatusSchema,
} from "./common";

export const tripSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  coverImage: z.string().nullable(),
  startDate: sqliteDateSchema,
  endDate: sqliteDateSchema.nullable(),
  status: tripStatusSchema,
  isPublic: sqliteBooleanSchema,
  slug: z.string().nullable(),
  budget: z.number().nullable(),
  currency: z.string(),
  createdAt: sqliteDateSchema,
  updatedAt: sqliteDateSchema,
});

export const tripWithCountsSchema = tripSchema.extend({
  memoriesCount: z.number().int().nonnegative(),
  expensesCount: z.number().int().nonnegative(),
});

export const dashboardTripSchema = tripSchema.extend({
  memoriesCount: z.number().int().nonnegative(),
});

export type Trip = z.infer<typeof tripSchema>;
export type TripWithCounts = z.infer<typeof tripWithCountsSchema>;
export type DashboardTrip = z.infer<typeof dashboardTripSchema>;
