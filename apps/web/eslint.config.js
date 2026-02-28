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
];

