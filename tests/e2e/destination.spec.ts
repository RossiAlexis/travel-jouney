import { expect, test, type Page } from "@playwright/test";
import { expectNoA11yViolations } from "./helpers/a11y";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

async function registerAndCreateTrip(
  page: Page,
  id: string,
): Promise<{ tripId: string }> {
  const email = `dest-e2e-${id}@example.com`;
  const username = `destu${id}`;
  const password = "Password123";

  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Display Name").fill("Destination E2E");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm Password").fill(password);
  await page.getByRole("button", { name: /Create account/i }).click();

  await expect(page).toHaveURL("/dashboard");

  await page.goto("/trips/new");
  await page.getByLabel(/^Title/).fill(`Destination Test Trip ${id}`);
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

test.describe("Destination CRUD", () => {
  test("create, view, add memory, and edit a destination", async ({ page }) => {
    const id = Date.now().toString().slice(-8);
    const { tripId } = await registerAndCreateTrip(page, id);

    // ── 1. Create destination ────────────────────────────────────────────────
    await page.goto(`/trips/${tripId}/destinations/new`);
    await expect(
      page.getByRole("heading", { name: /Add Destination/i }),
    ).toBeVisible();

    await page.getByLabel(/^Name/).fill(`Toronto ${id}`);

    await page.getByRole("button", { name: /^Create Destination$/i }).click();

    // ── 2. Verify redirect to destination detail ────────────────────────────
    await expect(page).not.toHaveURL(/\/destinations\/new$/);
    await expect(page).toHaveURL(
      /\/trips\/[^/]+\/destinations\/[^/]+$/,
    );
    const destinationId = page.url().split("/").at(-1)!;
    expect(destinationId).toBeTruthy();

    await expect(
      page.getByRole("heading", { name: `Toronto ${id}` }),
    ).toBeVisible();

    // ── 3. Destination detail a11y ────────────────────────────────────────────
    await expectNoA11yViolations(page);

    // ── 4. Add memory to destination ─────────────────────────────────────────
    await page.getByRole("link", { name: /^Add Memory$/i }).click();
    await expect(page).toHaveURL(
      /\/destinations\/[^/]+\/memories\/new$/,
    );

    await page.getByLabel(/^Title/).fill(`Destination Memory ${id}`);
    await page.getByLabel(/^Memory/).fill("A memory added to the destination.");

    await page.getByRole("button", { name: /^Save Memory$/i }).click();

    // After save the redirect goes to the memory detail page
    await expect(page).toHaveURL(
      /\/trips\/[^/]+\/memories\/[^/]+$/,
    );
    await expect(
      page.getByRole("heading", { name: `Destination Memory ${id}` }),
    ).toBeVisible();

    // Navigate back to destination detail and verify the memory appears
    await page.goto(`/trips/${tripId}/destinations/${destinationId}`);
    await expect(page.getByText(`Destination Memory ${id}`)).toBeVisible();

    // ── 5. Edit destination ───────────────────────────────────────────────────
    await page.getByRole("link", { name: /^Edit$/i }).click();
    await expect(page).toHaveURL(
      /\/destinations\/[^/]+\/edit$/,
    );
    await expect(
      page.getByRole("heading", { name: /Edit Destination/i }),
    ).toBeVisible();
    await expectNoA11yViolations(page);

    const nameInput = page.getByLabel(/^Name/);
    await nameInput.clear();
    await nameInput.fill(`Updated Toronto ${id}`);

    await page.getByRole("button", { name: /^Save Changes$/i }).click();

    // Should redirect to destination detail with updated name
    await expect(page).toHaveURL(
      `/trips/${tripId}/destinations/${destinationId}`,
    );
    await expect(
      page.getByRole("heading", { name: `Updated Toronto ${id}` }),
    ).toBeVisible();
  });
});
