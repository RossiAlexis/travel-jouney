import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:5173";
const TEST_EMAIL = "e2e-test@bitacora.test";
const TEST_PASSWORD = "E2eTestPassword!99";

// These tests use Node.js fetch — no browser needed
// They validate the JSON API contract for mobile clients

test.describe("Mobile API contract", () => {
  let accessToken: string;
  let refreshToken: string;

  test("POST /api/auth/login returns token pair", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("token");
    expect(body).toHaveProperty("refreshToken");
    expect(body.user).toHaveProperty("id");
    expect(body.user.email).toBe(TEST_EMAIL);
    accessToken = body.token;
    refreshToken = body.refreshToken;
  });

  test("GET /api/trips with Bearer JWT returns array", async () => {
    const res = await fetch(`${BASE_URL}/api/trips`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("POST /api/auth/refresh rotates tokens", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("token");
    expect(body).toHaveProperty("refreshToken");
    // New tokens should be different from original
    expect(body.refreshToken).not.toBe(refreshToken);
  });
});
