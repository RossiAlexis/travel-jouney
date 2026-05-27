import {
  registerSchema,
  resetPasswordSchema,
  tripSchemaWithDates,
  memorySchema,
  expenseSchema,
  destinationSchema,
  loginSchema,
} from "~/lib/validations";

describe("validation schemas", () => {
  // ── existing register / reset / trip tests ──────────────────────────────

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

  // ── memorySchema ─────────────────────────────────────────────────────────

  describe("memorySchema", () => {
    const validMemory = {
      title: "Sunset at the lake",
      content: "The colours were incredible.",
      date: "2026-01-15",
      category: "REFLECTION",
    };

    it("accepts a valid memory with all required fields", () => {
      expect(memorySchema.safeParse(validMemory).success).toBe(true);
    });

    it("accepts a valid memory with optional fields absent", () => {
      // locationName and rating are optional — omitting them must succeed
      expect(memorySchema.safeParse(validMemory).success).toBe(true);
    });

    it("rejects a memory missing title", () => {
      const { title: _, ...noTitle } = validMemory;
      expect(memorySchema.safeParse(noTitle).success).toBe(false);
    });

    it("rejects a memory missing content", () => {
      const { content: _, ...noContent } = validMemory;
      expect(memorySchema.safeParse(noContent).success).toBe(false);
    });

    it("rejects a memory with an invalid date string", () => {
      expect(
        memorySchema.safeParse({ ...validMemory, date: "not-a-date" }).success,
      ).toBe(false);
    });

    it("coerces a string rating to a number", () => {
      const result = memorySchema.safeParse({ ...validMemory, rating: "3" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rating).toBe(3);
      }
    });

    it("rejects a rating above the maximum (5)", () => {
      expect(
        memorySchema.safeParse({ ...validMemory, rating: 6 }).success,
      ).toBe(false);
    });

    it("rejects an invalid category value", () => {
      expect(
        memorySchema.safeParse({ ...validMemory, category: "INVALID" }).success,
      ).toBe(false);
    });

    it("accepts every valid category enum value", () => {
      const categories = [
        "ACCOMMODATION",
        "FOOD",
        "ACTIVITY",
        "TRANSPORT",
        "REFLECTION",
        "OTHER",
      ];
      for (const category of categories) {
        expect(
          memorySchema.safeParse({ ...validMemory, category }).success,
          `category ${category} should be valid`,
        ).toBe(true);
      }
    });
  });

  // ── expenseSchema ─────────────────────────────────────────────────────────

  describe("expenseSchema", () => {
    const validExpense = {
      amount: 45.5,
      currency: "USD",
      category: "FOOD",
      description: "Dinner at local restaurant",
      date: "2026-01-15",
    };

    it("accepts a valid expense", () => {
      expect(expenseSchema.safeParse(validExpense).success).toBe(true);
    });

    it("rejects an amount of 0 (must be positive)", () => {
      expect(
        expenseSchema.safeParse({ ...validExpense, amount: 0 }).success,
      ).toBe(false);
    });

    it("coerces a string amount to a number", () => {
      const result = expenseSchema.safeParse({
        ...validExpense,
        amount: "45.50",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(45.5);
      }
    });

    it("rejects a currency that is not exactly 3 characters", () => {
      expect(
        expenseSchema.safeParse({ ...validExpense, currency: "US" }).success,
      ).toBe(false);
    });

    it("rejects an invalid expense category", () => {
      expect(
        expenseSchema.safeParse({ ...validExpense, category: "MISC" }).success,
      ).toBe(false);
    });

    it("rejects an empty description", () => {
      expect(
        expenseSchema.safeParse({ ...validExpense, description: "" }).success,
      ).toBe(false);
    });
  });

  // ── destinationSchema ─────────────────────────────────────────────────────

  describe("destinationSchema", () => {
    it("accepts a valid destination with only the required name", () => {
      expect(
        destinationSchema.safeParse({ name: "Toronto" }).success,
      ).toBe(true);
    });

    it("rejects a destination with missing name", () => {
      expect(destinationSchema.safeParse({}).success).toBe(false);
    });

    it("accepts a destination with all optional fields absent", () => {
      // description, startDate, endDate, locationName, latitude, longitude all optional
      expect(
        destinationSchema.safeParse({ name: "Paris" }).success,
      ).toBe(true);
    });

    it("rejects an invalid startDate format", () => {
      expect(
        destinationSchema.safeParse({
          name: "London",
          startDate: "not-a-date",
        }).success,
      ).toBe(false);
    });

    it("accepts a destination with valid dates", () => {
      expect(
        destinationSchema.safeParse({
          name: "Berlin",
          startDate: "2026-03-01",
          endDate: "2026-03-10",
        }).success,
      ).toBe(true);
    });
  });

  // ── loginSchema ───────────────────────────────────────────────────────────

  describe("loginSchema", () => {
    it("accepts valid credentials", () => {
      expect(
        loginSchema.safeParse({
          email: "user@example.com",
          password: "somepassword",
        }).success,
      ).toBe(true);
    });

    it("rejects an invalid email address", () => {
      expect(
        loginSchema.safeParse({
          email: "not-an-email",
          password: "somepassword",
        }).success,
      ).toBe(false);
    });

    it("rejects an empty password", () => {
      expect(
        loginSchema.safeParse({
          email: "user@example.com",
          password: "",
        }).success,
      ).toBe(false);
    });
  });
});
