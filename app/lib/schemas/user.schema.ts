import { z } from "zod";
import { sqliteDateSchema } from "./common";

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  passwordHash: z.string().nullable().optional(),
  username: z.string(),
  displayName: z.string(),
  avatar: z.string().nullable(),
  bio: z.string().nullable(),
  createdAt: sqliteDateSchema,
  updatedAt: sqliteDateSchema,
});

export const sessionUserSchema = userSchema.pick({
  id: true,
  email: true,
  username: true,
  displayName: true,
  avatar: true,
});

export const accountSchema = z.object({
  id: z.string(),
  userId: z.string(),
  provider: z.string(),
  providerAccountId: z.string(),
  createdAt: sqliteDateSchema,
});

export const sessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  expiresAt: sqliteDateSchema,
  createdAt: sqliteDateSchema,
});

export type User = z.infer<typeof userSchema>;
export type SessionUser = z.infer<typeof sessionUserSchema>;
export type Account = z.infer<typeof accountSchema>;
export type Session = z.infer<typeof sessionSchema>;
