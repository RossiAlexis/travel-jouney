import { expect, test, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function registerUser(
  page: Page,
  id: string
): Promise<{ username: string; password: string }> {
  const email = `pub-trip-${id}@example.com`;
  const username = `pubu${id}`;
  const password = "Password123";

  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Display Name").fill("Pub Trip E2E");
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm Password").fill(password);
  await page.getByRole("button", { name: /Create account/i }).click();
  await expect(page).toHaveURL("/dashboard");

  return { username, password };
}

async function createTrip(page: Page, title: string): Promise<string> {
  await page.goto("/trips/new");
  await page.getByLabel(/^Title/).fill(title);
  await page.getByLabel(/^Start Date/).fill("2026-06-01");
  await page.getByRole("button", { name: /^Create Trip$/i }).click();
  await expect(page).toHaveURL(/\/trips\/[^/]+$/);
  return page.url().split("/").at(-1)!;
}

async function publishTrip(page: Page, tripId: string): Promise<string> {
  await page.goto(`/trips/${tripId}/edit`);
  const toggle = page.getByRole("switch", { name: /Public trip/i });
  await expect(toggle).toBeVisible();

  const isChecked = await toggle.isChecked();
  if (!isChecked) {
    await toggle.click();
  }

  await page.getByRole("button", { name: /^Save Changes$/i }).click();
  await expect(page).toHaveURL(`/trips/${tripId}`);

  // Re-open edit page to read the generated public URL
  await page.goto(`/trips/${tripId}/edit`);
  const urlCode = page.locator("code").filter({ hasText: /\// }).first();
  const publicUrl = await urlCode.textContent();
  return publicUrl?.trim() ?? "";
}

async function unpublishTrip(page: Page, tripId: string): Promise<void> {
  await page.goto(`/trips/${tripId}/edit`);
  const toggle = page.getByRole("switch", { name: /Public trip/i });
  const isChecked = await toggle.isChecked();
  if (isChecked) {
    await toggle.click();
  }
  await page.getByRole("button", { name: /^Save Changes$/i }).click();
  await expect(page).toHaveURL(`/trips/${tripId}`);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe("Public trip route", () => {
  test("private trip returns 404 from the public URL pattern", async ({
    page,
  }) => {
    const id = Date.now().toString().slice(-8);
    await registerUser(page, `priv${id}`);
    await createTrip(page, `Private Trip ${id}`);

    // Access a plausible public URL for a trip that was never published
    const response = await page.goto(`/nonexistentuser${id}/some-trip-slug`);
    expect(response?.status()).toBe(404);
  });

  test("published trip is accessible at its public URL without authentication", async ({
    page,
    context,
  }) => {
    const id = Date.now().toString().slice(-8);
    const { username } = await registerUser(page, `pub${id}`);
    const tripId = await createTrip(page, `Public Trip ${id}`);
    const publicUrl = await publishTrip(page, tripId);

    expect(publicUrl).toContain(`/${username}/`);

    // Open the public URL in a fresh context (no session cookie)
    const anonPage = await context.newPage();
    await anonPage.context().clearCookies();
    const response = await anonPage.goto(publicUrl);

    expect(response?.status()).toBe(200);
    await expect(
      anonPage.getByRole("heading", { name: `Public Trip ${id}`, level: 1 }),
    ).toBeVisible();
    await anonPage.close();
  });

  test("unpublished trip returns 404 at its former public URL", async ({
    page,
    context,
  }) => {
    const id = Date.now().toString().slice(-8);
    await registerUser(page, `unp${id}`);
    const tripId = await createTrip(page, `Unpublish Me ${id}`);
    const publicUrl = await publishTrip(page, tripId);

    // Verify it was reachable first
    const anonPage = await context.newPage();
    await anonPage.context().clearCookies();
    expect((await anonPage.goto(publicUrl))?.status()).toBe(200);

    // Unpublish
    await unpublishTrip(page, tripId);

    // The URL must now return 404
    const response = await anonPage.goto(publicUrl);
    expect(response?.status()).toBe(404);
    await anonPage.close();
  });

  test("renaming a published trip does not change its slug or public URL", async ({
    page,
    context,
  }) => {
    const id = Date.now().toString().slice(-8);
    await registerUser(page, `frz${id}`);
    const tripId = await createTrip(page, `Freeze Slug Trip ${id}`);
    const publicUrl = await publishTrip(page, tripId);

    // Rename the trip
    await page.goto(`/trips/${tripId}/edit`);
    const titleInput = page.getByLabel(/^Title/);
    await titleInput.clear();
    await titleInput.fill(`Renamed Trip ${id}`);
    await page.getByRole("button", { name: /^Save Changes$/i }).click();
    await expect(page).toHaveURL(`/trips/${tripId}`);

    // The original public URL must still resolve
    const anonPage = await context.newPage();
    await anonPage.context().clearCookies();
    const response = await anonPage.goto(publicUrl);
    expect(response?.status()).toBe(200);

    // And must show the new title (content updated, URL unchanged)
    await expect(
      anonPage.getByRole("heading", { name: `Renamed Trip ${id}`, level: 1 }),
    ).toBeVisible();
    await anonPage.close();
  });

  test("unpublishing then republishing reuses the same slug and URL", async ({
    page,
    context,
  }) => {
    const id = Date.now().toString().slice(-8);
    await registerUser(page, `reus${id}`);
    const tripId = await createTrip(page, `Reuse Slug Trip ${id}`);

    const publicUrl = await publishTrip(page, tripId);
    await unpublishTrip(page, tripId);
    const publicUrlAfterRepublish = await publishTrip(page, tripId);

    expect(publicUrlAfterRepublish).toBe(publicUrl);

    const anonPage = await context.newPage();
    await anonPage.context().clearCookies();
    expect((await anonPage.goto(publicUrlAfterRepublish))?.status()).toBe(200);
    await anonPage.close();
  });

  test("public trip page does not expose expenses or private fields", async ({
    page,
    context,
  }) => {
    const id = Date.now().toString().slice(-8);
    const { username } = await registerUser(page, `priv2${id}`);
    const tripId = await createTrip(page, `No Leak Trip ${id}`);
    const publicUrl = await publishTrip(page, tripId);

    const anonPage = await context.newPage();
    await anonPage.context().clearCookies();
    await anonPage.goto(publicUrl);

    // Expenses tab / section must not be visible to anonymous visitor
    await expect(anonPage.getByText(/Expenses/i)).not.toBeVisible();
    // Email must not appear
    await expect(
      anonPage.getByText(`pub-trip-priv2${id}@example.com`),
    ).not.toBeVisible();
    await anonPage.close();
  });
});
