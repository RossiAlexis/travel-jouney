import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { build } from "esbuild";
import { defineConfig, type Plugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const prismaEdge = resolve(__dirname, "app/generated/prisma/edge.js");

const PRISMA_BRIDGE_ID = "\0prisma-bridge";

function isPrismaEdgeFile(id: string): boolean {
  const n = id.split(/[/\\]/).join("/");
  return n.endsWith("app/generated/prisma/edge.js");
}

/**
 * Rollup leaves Prisma's raw CJS (`exports.*`, `require`) in the Worker bundle,
 * which throws `exports is not defined` on Cloudflare. Esbuild wraps that CJS
 * and emits `export default require_edge()` so the bridge can use default interop.
 */
function prismaEdgeEsmBundle(): Plugin {
  let cache: string | null = null;
  return {
    name: "prisma-edge-esm-bundle",
    enforce: "pre",
    buildStart() {
      cache = null;
    },
    async load(id) {
      if (!isPrismaEdgeFile(id)) {
        return;
      }
      if (cache) {
        return cache;
      }
      const result = await build({
        absWorkingDir: __dirname,
        entryPoints: [prismaEdge],
        bundle: true,
        format: "esm",
        platform: "neutral",
        conditions: ["workerd", "worker", "import"],
        write: false,
        outfile: "prisma-edge-esm.js",
        logLevel: "silent",
        external: ["*.wasm", "./query_compiler_bg.wasm"],
      });
      const out = result.outputFiles?.[0]?.text;
      if (!out) {
        throw new Error("esbuild produced no output for Prisma edge.js");
      }
      cache = out;
      return cache;
    },
  };
}

const prismaEdgeBridge = () => ({
  name: "prisma-edge-bridge",
  enforce: "pre" as const,

  resolveId(id: string, importer?: string) {
    if (
      importer &&
      !importer.includes("node_modules") &&
      (id.endsWith("/generated/prisma") || id === "~/generated/prisma")
    ) {
      return PRISMA_BRIDGE_ID;
    }
  },

  load(id: string) {
    if (id === PRISMA_BRIDGE_ID) {
      return [
        `import * as _mod from ${JSON.stringify(prismaEdge)};`,
        `const _p = _mod.default || _mod;`,
        `export const PrismaClient = _p.PrismaClient;`,
        `export const Prisma = _p.Prisma;`,
        `export const TripStatus = _p.TripStatus;`,
        `export const EntryCategory = _p.EntryCategory;`,
        `export const ExpenseCategory = _p.ExpenseCategory;`,
        `export const $Enums = _p.$Enums;`,
      ].join("\n");
    }
  },
});

export default defineConfig({
  plugins: [
    prismaEdgeEsmBundle(),
    prismaEdgeBridge(),
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
  ],
});
