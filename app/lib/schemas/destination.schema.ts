import { z } from "zod";
import { sqliteDateSchema } from "./common";

export const destinationSchema = z.object({
  id: z.string(),
  tripId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  coverImage: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  order: z.number().int(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  placeId: z.string().nullable(),
  createdAt: sqliteDateSchema,
  updatedAt: sqliteDateSchema,
});

export const destinationWithMemoryCountSchema = destinationSchema.extend({
  memoriesCount: z.number().int().nonnegative(),
});

export type Destination = z.infer<typeof destinationSchema>;
export type DestinationWithMemoryCount = z.infer<typeof destinationWithMemoryCountSchema>;
