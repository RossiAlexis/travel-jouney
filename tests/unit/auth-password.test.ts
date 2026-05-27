// @vitest-environment node
import { hashPassword, verifyPassword } from "~/lib/auth.server";

describe("password hashing", () => {
  it("creates PBKDF2 hashes and verifies valid passwords", async () => {
    const hash = await hashPassword("Password123");

    expect(hash.startsWith("pbkdf2:")).toBe(true);
    await expect(verifyPassword("Password123", hash)).resolves.toBe(true);
  });

  it("rejects invalid passwords", async () => {
    const hash = await hashPassword("Password123");
    await expect(verifyPassword("WrongPassword1", hash)).resolves.toBe(false);
  });
});
