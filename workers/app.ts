import { createRequestHandler } from "react-router";
import {
  createRepositories,
  type Repositories,
} from "../app/lib/repositories";

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
    repos: Repositories;
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

    const repos = createRepositories(env.DB);

    return requestHandler(request, {
      cloudflare: { env, ctx },
      repos,
    });
  },
} satisfies ExportedHandler<CloudflareEnv>;
