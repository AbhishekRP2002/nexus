import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenRouter } from "@langchain/openrouter";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { envConfig } from "../../config/env.js";
import type { LLMConfig } from "./types.js";

const DEFAULTS = {
  openai: {
    model: "gpt-5.1",
    maxTokens: 4096,
  },
  anthropic: {
    model: "claude-sonnet-4-5-20250929",
    temperature: 0,
    maxTokens: 4096,
  },
  openrouter: {
    model: "openai/gpt-oss-120b",
    maxTokens: 4096,
  },
} as const;

export function createLLM(config?: LLMConfig): BaseChatModel {
  const { provider: providerOverride, ...rest } = config ?? {};
  const provider = providerOverride ?? envConfig.LLM_PROVIDER;
  const defaults = DEFAULTS[provider];

  if (provider === "anthropic") {
    return new ChatAnthropic({
      model: defaults.model,
      temperature: "temperature" in defaults ? defaults.temperature : undefined,
      maxTokens: defaults.maxTokens,
      apiKey: envConfig.ANTHROPIC_API_KEY,
      ...(rest as Record<string, unknown>),
    });
  }

  if (provider === "openai") {
    return new ChatOpenAI({
      model: defaults.model,
      maxTokens: defaults.maxTokens,
      apiKey: envConfig.OPENAI_API_KEY,
      ...(rest as Record<string, unknown>),
    });
  }

  return new ChatOpenRouter({
    model: defaults.model,
    maxTokens: defaults.maxTokens,
    apiKey: envConfig.OPENROUTER_API_KEY,
    siteName: "nexus",
    ...(rest as Record<string, unknown>),
  });
}
