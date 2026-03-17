import { test, expect } from "./fixtures";
import { db } from "@repo/db";

test.describe("Memory creation", () => {
  let tripId: string;

  test.beforeAll(async ({ browser }) => {
    // Create a trip via DB for isolation
    const user = await db.user.findUnique({
      where: { email: "e2e-test@bitacora.test" },
      select: { id: true },
    });
    if (!user) throw new Error("Test user not found");

    const trip = await db.trip.create({
      data: {
        userId: user.id,
        title: "E2E Memory Test Trip",
        startDate: new Date("2026-07-01"),
        status: "ONGOING",
        currency: "USD",
      },
    });
    tripId = trip.id;
  });

  test.afterAll(async () => {
    if (tripId) await db.trip.delete({ where: { id: tripId } }).catch(() => {});
    await db.$disconnect();
  });

  test("navigates to new memory form", async ({ page }) => {
    await page.goto(`/trips/${tripId}`);
    // Look for the Add Memory link/button
    const addBtn = page.getByRole("link", { name: /add memory|new memory/i });
    if (await addBtn.isVisible()) {
      await addBtn.click();
    } else {
      await page.goto(`/trips/${tripId}/memories/new`);
    }
    await expect(page).toHaveURL(/memories\/new/);
  });

  test("creates a memory via the wizard", async ({ page }) => {
    await page.goto(`/trips/${tripId}/memories/new`);

    // Step 1
    await page.getByLabel(/title/i).fill("E2E Memory Title");
    await page.getByLabel(/date/i).fill("2026-07-01");
    await page.getByRole("button", { name: /next/i }).click();

    // Step 2
    await page.getByRole("textbox").last().fill("E2E memory content for testing");
    await page.getByRole("button", { name: /next/i }).click();

    // Step 3 — save
    await page.getByRole("button", { name: /save/i }).click();

    await expect(page).toHaveURL(/\/trips\//);
    await expect(page.getByText("E2E Memory Title")).toBeVisible();
  });
});
