import bcrypt from "bcryptjs";
import { db } from "./index.js";
import type { SessionUser } from "./index.js";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function registerUser(data: {
  email: string;
  username: string;
  displayName: string;
  password: string;
}): Promise<{ user: SessionUser } | { error: string }> {
  const existingEmail = await db.user.findUnique({
    where: { email: data.email },
  });

  if (existingEmail) {
    return { error: "An account with this email already exists" };
  }

  const existingUsername = await db.user.findUnique({
    where: { username: data.username },
  });

  if (existingUsername) {
    return { error: "This username is already taken" };
  }

  const passwordHash = await hashPassword(data.password);

  const user = await db.user.create({
    data: {
      email: data.email,
      username: data.username,
      displayName: data.displayName,
      passwordHash,
      accounts: {
        create: {
          provider: "credentials",
          providerAccountId: data.email,
        },
      },
    },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      avatar: true,
    },
  });

  return { user };
}

export async function loginWithPassword(data: {
  email: string;
  password: string;
}): Promise<{ user: SessionUser } | { error: string }> {
  const user = await db.user.findUnique({
    where: { email: data.email },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      avatar: true,
      passwordHash: true,
    },
  });

  if (!user || !user.passwordHash) {
    return { error: "Invalid email or password" };
  }

  const isValid = await verifyPassword(data.password, user.passwordHash);

  if (!isValid) {
    return { error: "Invalid email or password" };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...userWithoutPassword } = user;
  return { user: userWithoutPassword };
}
