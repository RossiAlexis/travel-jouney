import { sqliteDateSchema, sqliteBooleanSchema } from "~/lib/schemas/common";
import { memoryWithPhotosSchema } from "~/lib/schemas/memory.schema";

// ---------------------------------------------------------------------------
// sqliteDateSchema
// ---------------------------------------------------------------------------

describe("sqliteDateSchema", () => {
  it("parses an ISO string to a Date", () => {
    const result = sqliteDateSchema.safeParse("2026-01-15T10:30:00.000Z");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeInstanceOf(Date);
      expect(result.data.getFullYear()).toBe(2026);
    }
  });

  it("parses a Unix timestamp (number) to a Date", () => {
    const ts = new Date("2026-06-01").getTime();
    const result = sqliteDateSchema.safeParse(ts);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeInstanceOf(Date);
      expect(result.data.getFullYear()).toBe(2026);
    }
  });

  it("passes a Date object through unchanged (as a Date)", () => {
    const input = new Date("2026-03-20");
    const result = sqliteDateSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeInstanceOf(Date);
      expect(result.data.getTime()).toBe(input.getTime());
    }
  });

  it("rejects an unparseable string", () => {
    const result = sqliteDateSchema.safeParse("not-a-date");
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// sqliteBooleanSchema
// ---------------------------------------------------------------------------

describe("sqliteBooleanSchema", () => {
  it("maps 0 → false", () => {
    const result = sqliteBooleanSchema.safeParse(0);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe(false);
  });

  it("maps 1 → true", () => {
    const result = sqliteBooleanSchema.safeParse(1);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe(true);
  });

  it("maps boolean true → true", () => {
    const result = sqliteBooleanSchema.safeParse(true);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe(true);
  });

  it("maps boolean false → false", () => {
    const result = sqliteBooleanSchema.safeParse(false);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// memoryWithPhotosSchema
// ---------------------------------------------------------------------------

describe("memoryWithPhotosSchema", () => {
  const now = new Date().toISOString();

  const rawRow = {
    id: "mem-1",
    tripId: "trip-1",
    userId: "user-1",
    destinationId: null,
    title: "A wonderful memory",
    content: "It was great.",
    date: now,
    locationName: null,
    locationAddress: null,
    latitude: null,
    longitude: null,
    placeId: null,
    category: "FOOD",
    rating: null,
    isPublic: 0, // SQLite integer boolean
    slug: null,
    createdAt: now,
    updatedAt: now,
    photos: [],
  };

  it("parses a raw DB row (with string dates and integer booleans) into a typed object", () => {
    const result = memoryWithPhotosSchema.safeParse(rawRow);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("mem-1");
      expect(result.data.isPublic).toBe(false);
      expect(result.data.date).toBeInstanceOf(Date);
      expect(result.data.createdAt).toBeInstanceOf(Date);
      expect(result.data.updatedAt).toBeInstanceOf(Date);
    }
  });

  it("photos defaults to an empty array when passed as []", () => {
    const result = memoryWithPhotosSchema.safeParse({ ...rawRow, photos: [] });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.photos).toEqual([]);
    }
  });

  it("parses a row with photos containing id, url, and thumbnail", () => {
    const photos = [
      { id: "photo-1", url: "/photos/a.jpg", thumbnail: "/photos/a-thumb.jpg" },
    ];
    const result = memoryWithPhotosSchema.safeParse({ ...rawRow, photos });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.photos).toHaveLength(1);
      expect(result.data.photos[0].id).toBe("photo-1");
    }
  });

  it("maps integer 1 for isPublic to boolean true", () => {
    const result = memoryWithPhotosSchema.safeParse({ ...rawRow, isPublic: 1 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isPublic).toBe(true);
    }
  });
});
