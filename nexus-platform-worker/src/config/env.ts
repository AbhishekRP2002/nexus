import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..", "..", "..");

config({ path: resolve(rootDir, ".env") });

const envSchema = z.object({
  PORT: z.coerce.number().default(3005),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),

  LLM_PROVIDER: z.enum(["openai", "anthropic", "openrouter"]).default("openai"),

  QDRANT_ENDPOINT: z.string().url("QDRANT_ENDPOINT must be a valid URL"),
  QDRANT_API_KEY: z.string().min(1, "QDRANT_API_KEY is required"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const envConfig = parsed.data;
