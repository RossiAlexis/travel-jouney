import { test, expect } from "./fixtures";

// These auth tests need a clean (unauthenticated) context
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Authentication", () => {
  test("redirects unauthenticated user to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("nobody@example.com");
    await page.getByLabel(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
  });

  test("logs in with valid credentials and reaches dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("e2e-test@bitacora.test");
    await page.getByLabel(/password/i).fill("E2eTestPassword!99");
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("logout clears session", async ({ page }) => {
    // Log in first
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("e2e-test@bitacora.test");
    await page.getByLabel(/password/i).fill("E2eTestPassword!99");
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/dashboard/);

    // Navigate to logout
    await page.goto("/logout");
    await expect(page).toHaveURL(/\/login/);
  });
});
