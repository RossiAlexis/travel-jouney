import type { FullConfig } from "@playwright/test";
import { db } from "@repo/db";
import { hashPassword } from "@repo/db/auth";
import * as fs from "node:fs";
import * as path from "node:path";

export const TEST_USER = {
  email: "e2e-test@bitacora.test",
  username: "e2e_test_user",
  displayName: "E2E Test User",
  password: "E2eTestPassword!99",
} as const;

export default async function globalSetup(_config: FullConfig): Promise<void> {
  const authDir = path.join(process.cwd(), "playwright/.auth");
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Clean up any leftover test user
  await db.user.deleteMany({ where: { email: TEST_USER.email } });

  // Create test user directly in DB
  const passwordHash = await hashPassword(TEST_USER.password);
  await db.user.create({
    data: {
      email: TEST_USER.email,
      username: TEST_USER.username,
      displayName: TEST_USER.displayName,
      passwordHash,
      accounts: {
        create: {
          provider: "credentials",
          providerAccountId: TEST_USER.email,
        },
      },
    },
  });

  console.log("[global-setup] Test user created:", TEST_USER.email);
}
