import { z } from "zod";
import {
  entryCategorySchema,
  sqliteBooleanSchema,
  sqliteDateSchema,
} from "./common";

export const photoSchema = z.object({
  id: z.string(),
  entryId: z.string(),
  url: z.string(),
  thumbnail: z.string().nullable(),
  caption: z.string().nullable(),
  order: z.number().int(),
  createdAt: sqliteDateSchema,
});

export const entrySchema = z.object({
  id: z.string(),
  tripId: z.string(),
  userId: z.string(),
  title: z.string(),
  content: z.string(),
  date: sqliteDateSchema,
  locationName: z.string().nullable(),
  locationAddress: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  placeId: z.string().nullable(),
  category: entryCategorySchema,
  rating: z.number().int().nullable(),
  isPublic: sqliteBooleanSchema,
  slug: z.string().nullable(),
  createdAt: sqliteDateSchema,
  updatedAt: sqliteDateSchema,
});

export const entryWithPhotosSchema = entrySchema.extend({
  photos: z.array(
    photoSchema.pick({
      id: true,
      url: true,
      thumbnail: true,
    }),
  ),
});

export type Photo = z.infer<typeof photoSchema>;
export type Entry = z.infer<typeof entrySchema>;
export type EntryWithPhotos = z.infer<typeof entryWithPhotosSchema>;
