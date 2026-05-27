// @vitest-environment node
import { registerUser, loginWithPassword, hashPassword } from "~/lib/auth.server";

// ---------------------------------------------------------------------------
// Shared mock factory helpers
// ---------------------------------------------------------------------------

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    email: "test@example.com",
    username: "testuser",
    displayName: "Test User",
    avatar: null,
    bio: null,
    passwordHash: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeRepos(overrides: Record<string, unknown> = {}) {
  return {
    users: {
      findByEmail: vi.fn().mockResolvedValue(null),
      findByUsername: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(makeUser()),
      ...((overrides.users as Record<string, unknown>) ?? {}),
    },
    accounts: {
      create: vi.fn().mockResolvedValue({}),
      ...((overrides.accounts as Record<string, unknown>) ?? {}),
    },
  };
}

// ---------------------------------------------------------------------------
// registerUser
// ---------------------------------------------------------------------------

describe("registerUser", () => {
  const registrationData = {
    email: "new@example.com",
    username: "newuser",
    displayName: "New User",
    password: "Password123",
  };

  it("returns ok(sessionUser) when both email and username are available", async () => {
    const createdUser = makeUser({
      id: "user-abc",
      email: registrationData.email,
      username: registrationData.username,
      displayName: registrationData.displayName,
    });

    const repos = makeRepos({
      users: {
        findByEmail: vi.fn().mockResolvedValue(null),
        findByUsername: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(createdUser),
      },
    });

    const result = await registerUser(repos as never, registrationData);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe("user-abc");
      expect(result.value.email).toBe(registrationData.email);
      expect(result.value.username).toBe(registrationData.username);
      expect(result.value.displayName).toBe(registrationData.displayName);
    }
  });

  it("returns err when the email is already taken", async () => {
    const repos = makeRepos({
      users: {
        findByEmail: vi.fn().mockResolvedValue(makeUser()),
        findByUsername: vi.fn().mockResolvedValue(null),
        create: vi.fn(),
      },
    });

    const result = await registerUser(repos as never, registrationData);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("An account with this email already exists");
    }
    // create should not have been called
    expect(repos.users.create).not.toHaveBeenCalled();
  });

  it("returns err when the username is already taken", async () => {
    const repos = makeRepos({
      users: {
        findByEmail: vi.fn().mockResolvedValue(null),
        findByUsername: vi.fn().mockResolvedValue(makeUser()),
        create: vi.fn(),
      },
    });

    const result = await registerUser(repos as never, registrationData);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("This username is already taken");
    }
    expect(repos.users.create).not.toHaveBeenCalled();
  });

  it("the returned session user has the correct shape", async () => {
    const createdUser = makeUser({
      id: "user-shape",
      email: "shape@example.com",
      username: "shapeuser",
      displayName: "Shape User",
      avatar: "https://example.com/avatar.png",
    });

    const repos = makeRepos({
      users: {
        findByEmail: vi.fn().mockResolvedValue(null),
        findByUsername: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(createdUser),
      },
    });

    const result = await registerUser(repos as never, {
      email: "shape@example.com",
      username: "shapeuser",
      displayName: "Shape User",
      password: "Password123",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      // All expected keys must be present
      expect(Object.keys(result.value)).toEqual(
        expect.arrayContaining(["id", "email", "username", "displayName", "avatar"]),
      );
      expect(result.value.avatar).toBe("https://example.com/avatar.png");
    }
  });

  it("calls accounts.create after the user is created", async () => {
    const repos = makeRepos();

    await registerUser(repos as never, registrationData);

    expect(repos.accounts.create).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "credentials",
        providerAccountId: registrationData.email,
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// loginWithPassword
// ---------------------------------------------------------------------------

describe("loginWithPassword", () => {
  it("returns ok(sessionUser) with correct credentials", async () => {
    const password = "Password123";
    const passwordHash = await hashPassword(password);

    const storedUser = makeUser({
      id: "login-user",
      email: "login@example.com",
      username: "loginuser",
      displayName: "Login User",
      passwordHash,
    });

    const repos = {
      users: { findByEmail: vi.fn().mockResolvedValue(storedUser) },
    };

    const result = await loginWithPassword(repos as never, {
      email: "login@example.com",
      password,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.id).toBe("login-user");
      expect(result.value.email).toBe("login@example.com");
    }
  });

  it("returns err when the user is not found", async () => {
    const repos = {
      users: { findByEmail: vi.fn().mockResolvedValue(null) },
    };

    const result = await loginWithPassword(repos as never, {
      email: "ghost@example.com",
      password: "Password123",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Invalid email or password");
    }
  });

  it("returns err when the password is incorrect", async () => {
    const passwordHash = await hashPassword("CorrectPass1");
    const storedUser = makeUser({ passwordHash });

    const repos = {
      users: { findByEmail: vi.fn().mockResolvedValue(storedUser) },
    };

    const result = await loginWithPassword(repos as never, {
      email: storedUser.email,
      password: "WrongPass1",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Invalid email or password");
    }
  });
});
