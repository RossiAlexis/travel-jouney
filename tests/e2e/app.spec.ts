import { expect, test, type Page } from "@playwright/test";
import { expectNoA11yViolations } from "./helpers/a11y";

async function assertPageAndA11y(page: Page, path: string, text: RegExp | string) {
  await page.goto(path);
  await expect(page.getByText(text).first()).toBeVisible();
  await expectNoA11yViolations(page);
}

test.describe("Travel Journal screens", () => {
  test("public routes render and pass accessibility checks", async ({ page }) => {
    await assertPageAndA11y(page, "/", /Document Your/);
    await assertPageAndA11y(page, "/login", /Welcome back/i);
    await assertPageAndA11y(page, "/register", /Create an account/i);
    await assertPageAndA11y(page, "/forgot-password", /Forgot password\?/i);
    await assertPageAndA11y(page, "/reset-password/test-token", /Reset password/i);

    await page.goto("/auth/google");
    await expect(page).toHaveURL(/\/login\?error=oauth_not_configured/);
    await expect(page.getByText(/Welcome back/i)).toBeVisible();
    await expectNoA11yViolations(page);

    await page.goto("/auth/google/callback");
    await expect(page).toHaveURL(/\/login\?error=oauth_no_code/);
    await expect(page.getByText(/Welcome back/i)).toBeVisible();
    await expectNoA11yViolations(page);

    await page.goto("/logout");
    await expect(page).toHaveURL("/");
    await expect(page.getByText(/Document Your/)).toBeVisible();
    await expectNoA11yViolations(page);
  });

  test("authenticated routes render and pass accessibility checks", async ({
    page,
  }) => {
    const id = Date.now().toString().slice(-8);
    const email = `e2e-${id}@example.com`;
    const username = `u${id}`;
    const password = "Password123";

    await page.goto("/register");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Username").fill(username);
    await page.getByLabel("Display Name").fill("E2E User");
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByLabel("Confirm Password").fill(password);
    await page.getByRole("button", { name: /Create account/i }).click();

    await expect(page).toHaveURL("/dashboard");
    await expect(page.getByText(/Welcome back/i)).toBeVisible();
    await expectNoA11yViolations(page);

    await assertPageAndA11y(page, "/profile", /Edit Profile/i);
    await assertPageAndA11y(page, "/profile/edit", /Edit Profile/i);
    await assertPageAndA11y(page, "/trips/new", /Create New Trip/i);

    await page.getByLabel(/^Title/).fill(`E2E Test Trip ${id}`);
    await page.getByLabel(/^Start Date/).fill("2026-01-10");
    await page.getByRole("button", { name: /^Create Trip$/i }).click();
    await expect(page).not.toHaveURL("/trips/new");
    await expect(page).toHaveURL(/\/trips\/[^/]+$/);
    const tripId = page.url().split("/").at(-1);
    expect(tripId).toBeTruthy();
    if (!tripId || tripId === "new") {
      throw new Error("Trip ID not found after trip creation");
    }

    await expect(page.getByText(/E2E Test Trip/).first()).toBeVisible();
    await expectNoA11yViolations(page);

    await assertPageAndA11y(page, `/trips/${tripId}/edit`, /Edit Trip/i);
    await assertPageAndA11y(
      page,
      `/trips/${tripId}/memories/new`,
      /Add Memory/i
    );

    await page.goto(`/trips/${tripId}/memories/sample-memory`);
    await expect(page.getByText(/Memory detail view will be implemented/i)).toBeVisible();
    await expectNoA11yViolations(page);

    await assertPageAndA11y(
      page,
      `/trips/${tripId}/memories/sample-memory/edit`,
      /Edit Memory/i
    );
    await assertPageAndA11y(page, `/trips/${tripId}/expenses`, /Trip Expenses/i);
  });
});
