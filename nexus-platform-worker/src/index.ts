import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { generateSpecs } from "hono-openapi";
import { envConfig } from "./config/env.js";
import { requestId } from "./shared/middleware/request-id.js";
import { errorHandler } from "./shared/middleware/error-handler.js";
import { searchRoutes } from "./domains/search/search.routes.js";
import { getQdrantStore } from "./shared/vectorstore/qdrant.store.js";
import { logger } from "./shared/utils/logger.js";

const app = new Hono();

app.use("*", cors());
app.use("*", requestId);
app.onError(errorHandler);

app.get("/health", (c) =>
  c.json({ status: "ok", timestamp: new Date().toISOString() }),
);

app.route("/api/search", searchRoutes);

app.get("/openapi.json", async (c) => {
  const spec = await generateSpecs(app, {
    documentation: {
      info: {
        title: "Nexus Platform API",
        version: "0.1.0",
        description: "Knowledge management and AI-powered search API",
      },
      servers: [{ url: `http://localhost:${envConfig.PORT}` }],
    },
  });
  return c.json(spec);
});

app.get("/docs", (c) => {
  return c.html(`<!DOCTYPE html>
<html>
  <head>
    <title>Nexus API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
    <script>SwaggerUIBundle({ url: "/openapi.json", dom_id: "#swagger-ui" });</script>
  </body>
</html>`);
});

async function start() {
  const store = getQdrantStore();
  await store.initialize();

  serve({ fetch: app.fetch, port: envConfig.PORT }, () => {
    logger.info(
      { port: envConfig.PORT, env: envConfig.NODE_ENV },
      "nexus-platform-worker started",
    );
  });
}

start().catch((err) => {
  logger.fatal({ err }, "Failed to start worker");
  process.exit(1);
});
