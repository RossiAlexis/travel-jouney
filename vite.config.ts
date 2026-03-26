import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
const wranglerConfigPath = process.env.WRANGLER_CONFIG_PATH;

export default defineConfig({
  plugins: [
    cloudflare({
      viteEnvironment: { name: "ssr" },
      ...(wranglerConfigPath ? { configPath: wranglerConfigPath } : {}),
    }),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
  ],
});
