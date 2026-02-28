import reactConfig from "@repo/eslint-config/react";

/** @type {import("eslint").Linter.Config[]} */
export default [
  // Ignore build outputs and CJS config files
  {
    ignores: [
      "node_modules/**",
      ".expo/**",
      "dist/**",
      "*.cjs",
    ],
  },
  ...reactConfig,
  {
    rules: {
      "react/react-in-jsx-scope": "off",
    },
  },
];
