import { test, expect } from "./fixtures";

test.describe("Trip management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("navigates to create trip form", async ({ page }) => {
    await page.getByRole("link", { name: /new trip/i }).click();
    await expect(page).toHaveURL(/\/trips\/new/);
  });

  test("creates a new trip", async ({ page }) => {
    await page.goto("/trips/new");
    await page.getByLabel(/title/i).fill("E2E Test Trip");
    await page.getByLabel(/start date/i).fill("2026-06-01");
    await page.getByRole("button", { name: /create|save/i }).click();
    await expect(page).toHaveURL(/\/trips\//);
    await expect(page.getByText("E2E Test Trip")).toBeVisible();
  });

  test("shows trip on dashboard", async ({ page }) => {
    await expect(page.getByText("E2E Test Trip")).toBeVisible();
  });

  test("navigates to trip detail", async ({ page }) => {
    await page.getByRole("link", { name: /E2E Test Trip/i }).click();
    await expect(page).toHaveURL(/\/trips\//);
  });
});
