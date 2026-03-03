import type { ErrorHandler } from "hono";
import { logger } from "../utils/logger.js";

export const errorHandler: ErrorHandler = (err, c) => {
  const requestId = c.get("requestId") ?? "unknown";

  logger.error({ err, requestId }, "Unhandled error");

  const status =
    "status" in err && typeof err.status === "number" ? err.status : 500;
  const message = status === 500 ? "Internal server error" : err.message;

  return c.json({ error: message, requestId }, status as 500);
};
