import { db } from "@repo/db";

export default async function globalTeardown(): Promise<void> {
  await db.user.deleteMany({ where: { email: "e2e-test@bitacora.test" } });
  await db.$disconnect();
  console.log("[global-teardown] Test user deleted");
}
