import { reactRouter } from "@react-router/dev/vite";
import { cloudflareDevProxy } from "@react-router/cloudflare";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ isSsrBuild }) => ({
  build: {
    rollupOptions: isSsrBuild
      ? { input: "./workers/app.ts" }
      : undefined,
  },
  plugins: [
    cloudflareDevProxy({
      getLoadContext: async ({ context }) => {
        const { PrismaClient } = await import("@prisma/client");
        const { PrismaD1 } = await import("@prisma/adapter-d1");
        const adapter = new PrismaD1(context.cloudflare.env.DB);
        const db = new PrismaClient({ adapter });
        return { ...context, db };
      },
    }),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
  ],
}));
