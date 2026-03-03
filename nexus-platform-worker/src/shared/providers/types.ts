import type { ChatOpenAI } from "@langchain/openai";
import type { ChatAnthropic } from "@langchain/anthropic";
import type { ChatOpenRouter } from "@langchain/openrouter";
import type { OpenAIEmbeddings } from "@langchain/openai";

type OpenAIInput = NonNullable<ConstructorParameters<typeof ChatOpenAI>[0]>;
type AnthropicInput = NonNullable<
  ConstructorParameters<typeof ChatAnthropic>[0]
>;
type OpenRouterInput = NonNullable<
  ConstructorParameters<typeof ChatOpenRouter>[0]
>;
type EmbeddingsInput = NonNullable<
  ConstructorParameters<typeof OpenAIEmbeddings>[0]
>;

/** Configuration for creating an LLM instance. Provider-specific options can be included and will be passed through to the underlying model constructor. 
The `provider` field can be used to override the default provider specified in environment variables. 
**/

export type LLMConfig =
  | ({ provider?: "openai" } & Partial<OpenAIInput>)
  | ({ provider: "anthropic" } & Partial<AnthropicInput>)
  | ({ provider: "openrouter" } & Partial<OpenRouterInput>);

export type EmbeddingConfig = Partial<EmbeddingsInput>;
