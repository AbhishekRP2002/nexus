import pino from "pino";
import { envConfig } from "../../config/env.js";

export const logger = pino({
  level: envConfig.NODE_ENV === "production" ? "info" : "debug",
  transport:
    envConfig.NODE_ENV === "development"
      ? { target: "pino/file", options: { destination: 1 } }
      : undefined,
});
