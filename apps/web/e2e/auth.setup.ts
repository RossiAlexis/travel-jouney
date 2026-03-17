import { test as setup, expect } from "@playwright/test";
import * as path from "node:path";

const AUTH_STATE_PATH = path.join(process.cwd(), "playwright/.auth/user.json");

setup("authenticate test user", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel(/email/i).fill("e2e-test@bitacora.test");
  await page.getByLabel(/password/i).fill("E2eTestPassword!99");
  await page.getByRole("button", { name: /sign in|log in/i }).click();

  // Wait for redirect to dashboard after successful login
  await page.waitForURL(/\/(dashboard|$)/, { timeout: 10_000 });

  await page.context().storageState({ path: AUTH_STATE_PATH });
});
