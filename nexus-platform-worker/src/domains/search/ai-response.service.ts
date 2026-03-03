import { z } from "zod";
import { createLLM } from "../../shared/providers/llm.js";
import { searchSynthesisPrompt, formatSources } from "./search.prompts.js";
import type { CitationSource } from "../../types/search.types.js";
import type { VectorSearchResult } from "../../shared/vectorstore/types.js";

const responseSchema = z.object({
  response: z
    .string()
    .describe(
      "The synthesized answer with inline [N] citations referencing the source numbers.",
    ),
  citedSources: z
    .array(z.number())
    .describe(
      "Array of source numbers (1-indexed) that were cited in the response.",
    ),
  followUpQuestions: z
    .array(z.string())
    .describe("3-4 follow-up questions the user might want to explore."),
});

export type AiResponse = z.infer<typeof responseSchema>;

export async function generateAiResponse(
  query: string,
  retrievedDocs: VectorSearchResult[],
): Promise<{
  response: string;
  citations: Record<string, CitationSource>;
  followUpQuestions: string[];
}> {
  const llm = createLLM();
  const structuredLlm = llm.withStructuredOutput(responseSchema);

  const sourcesText = formatSources(
    retrievedDocs.map((doc) => ({
      id: doc.id,
      title: doc.payload.title,
      synopsis: doc.payload.synopsis,
      keyInsights: doc.payload.keyInsights,
      bodyText: doc.payload.bodyText,
    })),
  );

  const chain = searchSynthesisPrompt.pipe(structuredLlm);
  const result = await chain.invoke({ query, sources: sourcesText });

  const citations: Record<string, CitationSource> = {};
  for (const num of result.citedSources) {
    const doc = retrievedDocs[num - 1];
    if (doc) {
      citations[String(num)] = {
        id: doc.id,
        title: doc.payload.title,
        sourceType: doc.payload.sourceType,
        sourceUrl: doc.payload.sourceUrl,
      };
    }
  }

  return {
    response: result.response,
    citations,
    followUpQuestions: result.followUpQuestions,
  };
}
