import { expect, test, type Page } from "@playwright/test";
import { expectNoA11yViolations } from "./helpers/a11y";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

async function registerAndCreateTrip(
  page: Page,
  id: string,
): Promise<{ tripId: string }> {
  const email = `exp-e2e-${id}@example.com`;
  const username = `expu${id}`;
  const password = "Password123";

  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Display Name").fill("Expense E2E");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm Password").fill(password);
  await page.getByRole("button", { name: /Create account/i }).click();

  await expect(page).toHaveURL("/dashboard");

  await page.goto("/trips/new");
  await page.getByLabel(/^Title/).fill(`Expense Test Trip ${id}`);
  await page.getByLabel(/^Start Date/).fill("2026-02-01");
  await page.getByRole("button", { name: /^Create Trip$/i }).click();

  await expect(page).not.toHaveURL("/trips/new");
  await expect(page).toHaveURL(/\/trips\/[^/]+$/);
  const tripId = page.url().split("/").at(-1)!;

  return { tripId };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("Expense CRUD", () => {
  test("add, verify, and delete an expense", async ({ page }) => {
    const id = Date.now().toString().slice(-8);
    const { tripId } = await registerAndCreateTrip(page, id);

    // Navigate to expenses page
    await page.goto(`/trips/${tripId}/expenses`);
    await expect(
      page.getByRole("heading", { name: /^Expenses$/i }),
    ).toBeVisible();

    // ── 2. Expense page a11y (empty state) ───────────────────────────────────
    await expectNoA11yViolations(page);

    // ── 1. Add an expense ────────────────────────────────────────────────────
    await page.getByLabel(/^Description/).fill(`Dinner ${id}`);
    await page.getByLabel(/^Amount/).fill("42.50");
    // Currency select already defaults to trip currency (USD); leave it.
    // Category select already defaults to "OTHER"; leave it.
    // Date is pre-filled; leave it.

    await page.getByRole("button", { name: /^Add Expense$/i }).click();

    // Page reloads (redirect to same path) — wait for the expense to appear
    await expect(page.getByText(`Dinner ${id}`)).toBeVisible();

    // ── 3. Category totals card appears ──────────────────────────────────────
    // The default category is "OTHER" → CategoryTotals renders an "Other" card.
    await expect(page.getByText("Other").first()).toBeVisible();

    // ── 4. Delete expense ─────────────────────────────────────────────────────
    await page.getByRole("button", { name: /Delete expense/i }).click();

    // Confirm in AlertDialog
    await expect(
      page.getByRole("alertdialog", { name: /Delete Expense/i }),
    ).toBeVisible();
    await page.getByRole("button", { name: /^Delete$/i }).click();

    // After deletion the expense description should no longer appear
    await expect(page.getByText(`Dinner ${id}`)).not.toBeVisible();
  });
});
