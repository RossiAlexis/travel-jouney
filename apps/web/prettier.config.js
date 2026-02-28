import sharedConfig from "@repo/prettier-config";

/** @type {import("prettier").Config} */
const config = {
  ...sharedConfig,
  plugins: ["prettier-plugin-tailwindcss"],
};

export default config;
