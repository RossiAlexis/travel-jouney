import { createRequestHandler } from "@react-router/express";
import express from "express";
const app = express();
app.use(
  createRequestHandler({
    mode: process.env.NODE_ENV ?? "development",
    build: () => import("./assets/server-build-BIeQUnhC.js"),
    getLoadContext: async () => ({
      serverBuild: await import("./assets/server-build-BIeQUnhC.js")
    })
  })
);
export {
  app
};
//# sourceMappingURL=index.js.map
