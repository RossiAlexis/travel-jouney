import { z } from "zod";

// ============================================
// AUTH SCHEMAS
// ============================================

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    email: z.email("Please enter a valid email address"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be at most 20 characters")
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        "Username can only contain letters, numbers, underscores, and hyphens"
      ),
    displayName: z
      .string()
      .min(1, "Display name is required")
      .max(50, "Display name must be at most 50 characters"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// ============================================
// TRIP SCHEMAS
// ============================================

export const tripSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be at most 100 characters"),
  description: z
    .string()
    .max(500, "Description must be at most 500 characters")
    .optional(),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Please enter a valid start date",
  }),
  endDate: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "Please enter a valid end date",
    }),
  status: z.enum(["PLANNED", "ONGOING", "COMPLETED"]),
  budget: z.coerce.number().positive("Budget must be positive").optional(),
  currency: z
    .string()
    .length(3, "Currency must be a 3-letter code")
    .default("USD"),
});

export const tripSchemaWithDates = tripSchema.refine(
  (data) => {
    if (!data.endDate) return true;
    return new Date(data.endDate) >= new Date(data.startDate);
  },
  {
    message: "End date must be after or equal to start date",
    path: ["endDate"],
  }
);

// ============================================
// MEMORY SCHEMAS
// ============================================

export const memorySchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(100, "Title must be at most 100 characters"),
  content: z.string().min(1, "Content is required"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Please enter a valid date",
  }),
  category: z.enum([
    "ACCOMMODATION",
    "FOOD",
    "ACTIVITY",
    "TRANSPORT",
    "REFLECTION",
    "OTHER",
  ]),
  rating: z.coerce.number().min(1).max(5).optional(),
  locationName: z.string().max(100).optional(),
  locationAddress: z.string().max(200).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  destinationId: z.string().optional(),
});

// ============================================
// DESTINATION SCHEMAS
// ============================================

export const destinationSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),
  description: z
    .string()
    .max(500, "Description must be at most 500 characters")
    .optional(),
  startDate: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "Please enter a valid start date",
    }),
  endDate: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "Please enter a valid end date",
    }),
  locationName: z.string().max(100).optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
});

// ============================================
// EXPENSE SCHEMAS
// ============================================

export const expenseSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  currency: z.string().length(3, "Currency must be a 3-letter code"),
  category: z.enum([
    "ACCOMMODATION",
    "FOOD",
    "TRANSPORT",
    "ACTIVITIES",
    "SHOPPING",
    "OTHER",
  ]),
  description: z
    .string()
    .min(1, "Description is required")
    .max(200, "Description must be at most 200 characters"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Please enter a valid date",
  }),
  memoryId: z.string().optional(),
});

// ============================================
// PROFILE SCHEMAS
// ============================================

export const profileSchema = z.object({
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(50, "Display name must be at most 50 characters"),
  bio: z.string().max(500, "Bio must be at most 500 characters").optional(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type TripFormData = z.infer<typeof tripSchema>;
export type MemoryFormData = z.infer<typeof memorySchema>;
export type ExpenseFormData = z.infer<typeof expenseSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type DestinationFormData = z.infer<typeof destinationSchema>;
