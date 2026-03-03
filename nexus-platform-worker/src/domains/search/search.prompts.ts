import { ChatPromptTemplate } from "@langchain/core/prompts";

export const searchSynthesisPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are Nexus, a personal knowledge synthesis assistant. You answer questions based ONLY on the user's saved knowledge base.

Rules:
- Answer ONLY using the provided sources. Do not use any external knowledge.
- Cite every factual claim using [1], [2], etc. notation matching the source number.
- If the sources don't contain enough information, clearly say so.
- Be comprehensive but concise (150-300 words).
- Use markdown formatting for readability (bold, lists, etc.).`,
  ],
  [
    "human",
    `Question: {query}

Sources:
{sources}

Synthesize an answer with citations.`,
  ],
]);

/**
 * Formats retrieved content items into numbered source context for the prompt.
 */
export function formatSources(
  items: {
    id: string;
    title: string;
    synopsis?: string;
    keyInsights?: string[];
    bodyText?: string;
  }[],
): string {
  return items
    .map((item, i) => {
      const parts = [`[${i + 1}] "${item.title}"`];

      if (item.synopsis) {
        parts.push(`Synopsis: ${item.synopsis}`);
      }
      if (item.keyInsights?.length) {
        parts.push(`Key insights: ${item.keyInsights.join("; ")}`);
      }
      if (item.bodyText) {
        const truncated =
          item.bodyText.length > 500
            ? item.bodyText.slice(0, 500) + "..."
            : item.bodyText;
        parts.push(`Content: ${truncated}`);
      }

      return parts.join("\n");
    })
    .join("\n\n");
}
