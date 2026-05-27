import { expect, test, type Page } from "@playwright/test";
import { expectNoA11yViolations } from "./helpers/a11y";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

async function registerUser(page: Page, id: string): Promise<void> {
  const email = `trip-e2e-${id}@example.com`;
  const username = `tripu${id}`;
  const password = "Password123";

  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Display Name").fill("Trip E2E");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm Password").fill(password);
  await page.getByRole("button", { name: /Create account/i }).click();

  await expect(page).toHaveURL("/dashboard");
}

async function createTrip(page: Page, title: string): Promise<string> {
  await page.goto("/trips/new");
  await page.getByLabel(/^Title/).fill(title);
  await page.getByLabel(/^Start Date/).fill("2026-03-01");
  await page.getByRole("button", { name: /^Create Trip$/i }).click();

  await expect(page).not.toHaveURL("/trips/new");
  await expect(page).toHaveURL(/\/trips\/[^/]+$/);
  return page.url().split("/").at(-1)!;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("Trip management", () => {
  test("edit a trip title and verify the update", async ({ page }) => {
    const id = Date.now().toString().slice(-8);
    await registerUser(page, id);

    const tripId = await createTrip(page, `Original Trip ${id}`);

    // Navigate to edit page
    await page.goto(`/trips/${tripId}/edit`);
    await expect(
      page.getByRole("heading", { name: /Edit Trip/i }),
    ).toBeVisible();
    await expectNoA11yViolations(page);

    // Change the title
    const titleInput = page.getByLabel(/^Title/);
    await titleInput.clear();
    await titleInput.fill(`Updated Trip ${id}`);

    await page.getByRole("button", { name: /^Save Changes$/i }).click();

    // Should redirect to trip detail page
    await expect(page).toHaveURL(`/trips/${tripId}`);
    await expect(
      page.getByRole("heading", { name: `Updated Trip ${id}` }),
    ).toBeVisible();
  });

  test("delete a trip and verify it is removed from the dashboard", async ({
    page,
  }) => {
    const id = Date.now().toString().slice(-8);
    await registerUser(page, id);

    const tripId = await createTrip(page, `Delete Me Trip ${id}`);

    // We are now on the trip detail page — open the delete dialog
    await expect(page).toHaveURL(`/trips/${tripId}`);
    await expect(
      page.getByRole("heading", { name: `Delete Me Trip ${id}` }),
    ).toBeVisible();

    // Click the delete icon button (aria-label contains the trip title)
    await page
      .getByRole("button", { name: /Delete trip/i })
      .click();

    // Confirm in AlertDialog
    await expect(
      page.getByRole("alertdialog", { name: /Delete Trip/i }),
    ).toBeVisible();
    await page.getByRole("button", { name: /^Delete Trip$/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL("/dashboard");

    // The deleted trip title must no longer appear in the list
    await expect(page.getByText(`Delete Me Trip ${id}`)).not.toBeVisible();
  });
});
