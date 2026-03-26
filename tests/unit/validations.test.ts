import {
  registerSchema,
  resetPasswordSchema,
  tripSchemaWithDates,
} from "~/lib/validations";

describe("validation schemas", () => {
  it("rejects mismatched register passwords", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      username: "valid_user",
      displayName: "Valid User",
      password: "Password123",
      confirmPassword: "Password321",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["confirmPassword"]);
    }
  });

  it("rejects weak reset password values", () => {
    const result = resetPasswordSchema.safeParse({
      password: "weakpass",
      confirmPassword: "weakpass",
    });

    expect(result.success).toBe(false);
  });

  it("rejects trips where end date is before start date", () => {
    const result = tripSchemaWithDates.safeParse({
      title: "Test Trip",
      startDate: "2026-01-20",
      endDate: "2026-01-10",
      status: "PLANNED",
      currency: "USD",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["endDate"]);
    }
  });
});
