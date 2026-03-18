import reactConfig from "@repo/eslint-config/react";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...reactConfig,
  {
    ignores: [
      "node_modules/**",
      "build/**",
      ".react-router/**",
      "prisma/migrations/**",
      "public/**",
    ],
  },
  {
    // Prevent pages and routes from bypassing the service layer
    files: ["app/pages/**/*.{ts,tsx}", "app/routes/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@repo/db", "~/lib/db.server"],
              message:
                "Use @repo/services instead of importing directly from @repo/db. Data access must go through the service layer.",
            },
          ],
        },
      ],
    },
  },
  {
    // Auth route handlers are allowed to import @repo/db/auth for low-level
    // authentication primitives (token creation, hashing) not exposed via @repo/services
    files: ["app/routes/api/auth/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
];
