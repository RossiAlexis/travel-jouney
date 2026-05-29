import { generateSlug } from "~/lib/utils";

describe("generateSlug", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(generateSlug("Southeast Asia Adventure")).toBe(
      "southeast-asia-adventure",
    );
  });

  it("strips special characters", () => {
    expect(generateSlug("Tokyo! Ramen & Sushi?")).toBe("tokyo-ramen-sushi");
  });

  it("collapses multiple spaces and hyphens", () => {
    expect(generateSlug("New   York  City")).toBe("new-york-city");
  });

  it("strips accents from latin characters", () => {
    expect(generateSlug("Café in Montréal")).toBe("cafe-in-montreal");
  });

  it("trims leading and trailing whitespace", () => {
    expect(generateSlug("  Road Trip  ")).toBe("road-trip");
  });

  it("truncates at 80 characters", () => {
    const long = "a".repeat(90);
    expect(generateSlug(long).length).toBeLessThanOrEqual(80);
  });

  it("returns empty string for a title that has no alphanumeric chars", () => {
    expect(generateSlug("!!!")).toBe("");
  });

  it("preserves numbers", () => {
    expect(generateSlug("Summer 2026 Trip")).toBe("summer-2026-trip");
  });
});

describe("trip isPublic validation", () => {
  // Tests that the schema correctly handles isPublic field
  it("confirms tripSchemaWithDates includes isPublic", async () => {
    const { tripSchemaWithDates } = await import("~/lib/validations");
    const result = tripSchemaWithDates.safeParse({
      title: "My Trip",
      startDate: "2026-01-01",
      status: "PLANNED",
      currency: "USD",
      isPublic: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPublic).toBe(true);
    }
  });

  it("defaults isPublic to false when omitted", async () => {
    const { tripSchemaWithDates } = await import("~/lib/validations");
    const result = tripSchemaWithDates.safeParse({
      title: "My Trip",
      startDate: "2026-01-01",
      status: "PLANNED",
      currency: "USD",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPublic).toBe(false);
    }
  });

  it("coerces the string 'true' to boolean true", async () => {
    const { tripSchemaWithDates } = await import("~/lib/validations");
    const result = tripSchemaWithDates.safeParse({
      title: "My Trip",
      startDate: "2026-01-01",
      status: "PLANNED",
      currency: "USD",
      isPublic: "true",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPublic).toBe(true);
    }
  });

  it("treats absent isPublic as false (unchecked checkbox)", async () => {
    const { tripSchemaWithDates } = await import("~/lib/validations");
    const result = tripSchemaWithDates.safeParse({
      title: "My Trip",
      startDate: "2026-01-01",
      status: "PLANNED",
      currency: "USD",
      // isPublic absent — checkbox not submitted
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPublic).toBe(false);
    }
  });
});
