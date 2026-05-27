import { createRequestHandler } from "react-router";
import type { R2Bucket } from "@cloudflare/workers-types";
import {
  createRepositories,
  type Repositories,
} from "../app/lib/repositories";
import { getSession } from "../app/lib/session.server";

interface CloudflareEnv {
  DB: D1Database;
  PHOTOS?: R2Bucket;
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
    if (env.SESSION_SECRET) {
      process.env.SESSION_SECRET = env.SESSION_SECRET;
    }

    const repos = createRepositories(env.DB);

    // Serve photos from R2, auth-protected
    const url = new URL(request.url);
    if (url.pathname.startsWith("/photos/") && env.PHOTOS) {
      const key = url.pathname.slice(1); // "photos/{memoryId}/{file}"
      const parts = key.split("/");
      if (parts.length < 3) {
        return new Response("Not found", { status: 404 });
      }
      const memoryId = parts[1];

      const session = await getSession(request.headers.get("Cookie"));
      const userId = session.get("userId");
      if (!userId) {
        return new Response("Unauthorized", { status: 401 });
      }

      const row = await env.DB.prepare(
        `SELECT m.id FROM "Memory" m
         JOIN "Trip" t ON t.id = m."tripId"
         WHERE m.id = ?1 AND t."userId" = ?2`,
      )
        .bind(memoryId, userId)
        .first();

      if (!row) {
        return new Response("Not found", { status: 404 });
      }

      const object = await env.PHOTOS.get(key);
      if (!object) {
        return new Response("Not found", { status: 404 });
      }

      const headers = new Headers({
        "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
        "Cache-Control": "private, max-age=86400",
        "ETag": object.httpEtag,
      });

      // Cast needed: @cloudflare/workers-types ReadableStream differs from lib.dom
      return new Response(object.body as unknown as BodyInit, { headers });
    }

    return requestHandler(request, {
      cloudflare: { env, ctx },
      repos,
    });
  },
} satisfies ExportedHandler<CloudflareEnv>;
