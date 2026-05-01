import { z } from "zod";
import {
  memoryCategorySchema,
  sqliteBooleanSchema,
  sqliteDateSchema,
} from "./common";

export const photoSchema = z.object({
  id: z.string(),
  memoryId: z.string(),
  url: z.string(),
  thumbnail: z.string().nullable(),
  caption: z.string().nullable(),
  order: z.number().int(),
  createdAt: sqliteDateSchema,
});

export const memorySchema = z.object({
  id: z.string(),
  tripId: z.string(),
  userId: z.string(),
  destinationId: z.string().nullable(),
  title: z.string(),
  content: z.string(),
  date: sqliteDateSchema,
  locationName: z.string().nullable(),
  locationAddress: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  placeId: z.string().nullable(),
  category: memoryCategorySchema,
  rating: z.number().int().nullable(),
  isPublic: sqliteBooleanSchema,
  slug: z.string().nullable(),
  createdAt: sqliteDateSchema,
  updatedAt: sqliteDateSchema,
});

export const memoryWithPhotosSchema = memorySchema.extend({
  photos: z.array(
    photoSchema.pick({
      id: true,
      url: true,
      thumbnail: true,
    }),
  ),
});

export type Photo = z.infer<typeof photoSchema>;
export type Memory = z.infer<typeof memorySchema>;
export type MemoryWithPhotos = z.infer<typeof memoryWithPhotosSchema>;
