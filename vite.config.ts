import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  environments: {
    ssr: {
      resolve: {
        // Tell Vite to prefer Workers/browser ESM conditions over Node CJS
        conditions: ["workerd", "worker", "browser", "module", "import", "default"],
        // Bundle all SSR deps so CJS packages (react, etc.) get converted to ESM
        noExternal: true,
      },
    },
  },
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
  ],
});
