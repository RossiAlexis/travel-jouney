import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  // Force pre-bundling of CJS packages so they're converted to ESM
  // before the Cloudflare Workers module runner loads them.
  // The Workers runtime has no CommonJS support (no `module`, no `require`).
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-dom/server",
    ],
  },
  environments: {
    ssr: {
      resolve: {
        conditions: ["workerd", "worker", "browser", "module", "import", "default"],
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
