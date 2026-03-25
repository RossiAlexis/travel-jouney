import { createRequestHandler } from "react-router";
import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";

interface CloudflareEnv {
  DB: D1Database;
  SESSION_SECRET: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REDIRECT_URI?: string;
}

declare module "react-router" {
  interface AppLoadContext {
    cloudflare: {
      env: CloudflareEnv;
      ctx: ExecutionContext;
    };
    db: PrismaClient;
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  async fetch(request: Request, env: CloudflareEnv, ctx: ExecutionContext) {
    // Inject runtime secrets into process.env so module-level lazy inits
    // (e.g. session storage) pick them up on first use.
    if (env.SESSION_SECRET) {
      process.env.SESSION_SECRET = env.SESSION_SECRET;
    }

    const adapter = new PrismaD1(env.DB);
    const db = new PrismaClient({ adapter });

    try {
      return await requestHandler(request, {
        cloudflare: { env, ctx },
        db,
      });
    } finally {
      ctx.waitUntil(db.$disconnect());
    }
  },
} satisfies ExportedHandler<CloudflareEnv>;
