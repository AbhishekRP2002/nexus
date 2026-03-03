import { createMiddleware } from "hono/factory";
import { randomUUID } from "crypto";

/**
 * Attaches a unique request ID to every request.
 * Available via c.get("requestId") in handlers.
 */
export const requestId = createMiddleware(async (c, next) => {
  const id = (c.req.header("x-request-id") as string) || randomUUID();
  c.set("requestId", id);
  c.header("x-request-id", id);
  await next();
});
