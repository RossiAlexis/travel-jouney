import { test as base, expect, type Page, type BrowserContext } from "@playwright/test";
import * as path from "node:path";

const AUTH_STATE_PATH = path.join(process.cwd(), "playwright/.auth/user.json");

type AuthFixtures = {
  authenticatedPage: Page;
  authenticatedContext: BrowserContext;
};

export const test = base.extend<AuthFixtures>({
  authenticatedContext: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: AUTH_STATE_PATH });
    await use(context);
    await context.close();
  },
  authenticatedPage: async ({ authenticatedContext }, use) => {
    const page = await authenticatedContext.newPage();
    await use(page);
  },
});

export { expect };
