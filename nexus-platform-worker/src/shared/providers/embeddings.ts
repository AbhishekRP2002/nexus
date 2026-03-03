import { OpenAIEmbeddings } from "@langchain/openai";
import { envConfig } from "../../config/env.js";
import type { EmbeddingConfig } from "./types.js";

const DEFAULTS = {
  model: "text-embedding-3-small",
  dimensions: 1536,
} as const;

export function createEmbeddings(config?: EmbeddingConfig) {
  return new OpenAIEmbeddings({
    model: DEFAULTS.model,
    dimensions: DEFAULTS.dimensions,
    apiKey: envConfig.OPENAI_API_KEY,
    ...config,
  });
}

// Singleton for shared use across domains
let _embeddings: OpenAIEmbeddings | null = null;

export function getEmbeddings(): OpenAIEmbeddings {
  if (!_embeddings) {
    _embeddings = createEmbeddings();
  }
  return _embeddings;
}
