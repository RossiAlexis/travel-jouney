import { expect, test, type Page } from "@playwright/test";
import { expectNoA11yViolations } from "./helpers/a11y";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

async function registerAndCreateTrip(
  page: Page,
  id: string,
): Promise<{ tripId: string }> {
  const email = `mem-e2e-${id}@example.com`;
  const username = `memu${id}`;
  const password = "Password123";

  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Display Name").fill("Memory E2E");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm Password").fill(password);
  await page.getByRole("button", { name: /Create account/i }).click();

  await expect(page).toHaveURL("/dashboard");

  await page.goto("/trips/new");
  await page.getByLabel(/^Title/).fill(`Memory Test Trip ${id}`);
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

test.describe("Memory CRUD", () => {
  test("create, view, edit, and delete a memory", async ({ page }) => {
    const id = Date.now().toString().slice(-8);
    const { tripId } = await registerAndCreateTrip(page, id);

    // ── 1. Create memory ────────────────────────────────────────────────────
    await page.goto(`/trips/${tripId}/memories/new`);
    await expect(
      page.getByRole("heading", { name: /Add Memory/i }),
    ).toBeVisible();

    await page.getByLabel(/^Title/).fill(`My Memory ${id}`);
    await page.getByLabel(/^Memory/).fill(
      "An incredible experience I will never forget.",
    );
    // Date is pre-filled with today; leave it.
    // Category select already defaults to "OTHER"; leave it.

    await page.getByRole("button", { name: /^Save Memory$/i }).click();

    // ── 2. Verify redirect to memory detail ─────────────────────────────────
    await expect(page).not.toHaveURL(/\/memories\/new$/);
    await expect(page).toHaveURL(/\/trips\/[^/]+\/memories\/[^/]+$/);
    const memoryId = page.url().split("/").at(-1)!;
    expect(memoryId).toBeTruthy();

    await expect(
      page.getByRole("heading", { name: `My Memory ${id}` }),
    ).toBeVisible();

    // ── 3. Memory detail a11y ────────────────────────────────────────────────
    await expectNoA11yViolations(page);

    // ── 4. Edit memory ───────────────────────────────────────────────────────
    await page.getByRole("link", { name: /^Edit$/i }).click();
    await expect(page).toHaveURL(/\/memories\/[^/]+\/edit$/);
    await expect(
      page.getByRole("heading", { name: /Edit Memory/i }),
    ).toBeVisible();
    await expectNoA11yViolations(page);

    // Clear the title field and type a new value
    const titleInput = page.getByLabel(/^Title/);
    await titleInput.clear();
    await titleInput.fill(`Updated Memory ${id}`);

    await page.getByRole("button", { name: /^Save Changes$/i }).click();

    // Should redirect back to the detail page
    await expect(page).toHaveURL(`/trips/${tripId}/memories/${memoryId}`);
    await expect(
      page.getByRole("heading", { name: `Updated Memory ${id}` }),
    ).toBeVisible();

    // ── 5. Delete memory ─────────────────────────────────────────────────────
    await page.getByRole("button", { name: /^Delete$/i }).click();

    // Confirm in AlertDialog
    await expect(
      page.getByRole("alertdialog", { name: /Delete Memory/i }),
    ).toBeVisible();
    await page.getByRole("button", { name: /^Delete Memory$/i }).click();

    // Should redirect back to the trip detail page
    await expect(page).toHaveURL(`/trips/${tripId}`);

    // The memory title must no longer appear in the trip's memory list
    await expect(
      page.getByText(`Updated Memory ${id}`),
    ).not.toBeVisible();
  });
});
