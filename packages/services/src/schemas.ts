import { z } from "zod";

const dateString = z.string().refine((v) => !isNaN(Date.parse(v)), { message: "Invalid date" });

// ============================================
// TRIP SCHEMAS
// ============================================

export const CreateTripSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  startDate: dateString,
  endDate: dateString.optional().nullable(),
  status: z.enum(["PLANNED", "ONGOING", "COMPLETED"]).optional(),
  budget: z.number().optional().nullable(),
  currency: z.string().optional(),
  coverImage: z.string().optional().nullable(),
});

export const UpdateTripSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  startDate: dateString.optional(),
  endDate: dateString.optional().nullable(),
  status: z.enum(["PLANNED", "ONGOING", "COMPLETED"]).optional(),
  budget: z.number().optional().nullable(),
  currency: z.string().optional(),
  coverImage: z.string().optional().nullable(),
  isPublic: z.boolean().optional(),
  slug: z.string().optional().nullable(),
});

// ============================================
// MEMORY SCHEMAS
// ============================================

export const CreateMemorySchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  date: dateString,
  locationName: z.string().optional().nullable(),
  locationAddress: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  placeId: z.string().optional().nullable(),
  category: z
    .enum(["ACCOMMODATION", "FOOD", "ACTIVITY", "TRANSPORT", "REFLECTION", "OTHER"])
    .optional(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  isPublic: z.boolean().optional(),
});

export const UpdateMemorySchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  date: dateString.optional(),
  locationName: z.string().optional().nullable(),
  locationAddress: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  placeId: z.string().optional().nullable(),
  category: z
    .enum(["ACCOMMODATION", "FOOD", "ACTIVITY", "TRANSPORT", "REFLECTION", "OTHER"])
    .optional(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  isPublic: z.boolean().optional(),
});

// ============================================
// EXPENSE SCHEMAS
// ============================================

export const CreateExpenseSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().min(1, "Currency is required"),
  date: dateString,
  category: z.enum(["ACCOMMODATION", "FOOD", "TRANSPORT", "ACTIVITIES", "SHOPPING", "OTHER"]),
  memoryId: z.string().optional().nullable(),
});

// ============================================
// PROFILE SCHEMAS
// ============================================

export const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).optional(),
  bio: z.string().optional().nullable(),
  avatar: z.string().optional().nullable(),
});

// ============================================
// AUTH SCHEMAS
// ============================================

export const LoginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export const RegisterSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  username: z.string().min(1, "Username is required"),
  displayName: z.string().min(1, "Display name is required"),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});
