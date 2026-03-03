import { getEmbeddings } from "../../shared/providers/embeddings.js";
import { getQdrantStore } from "../../shared/vectorstore/qdrant.store.js";
import { reciprocalRankFusion } from "../../shared/utils/rrf.js";
import { logger } from "../../shared/utils/logger.js";
import type { VectorSearchResult } from "../../shared/vectorstore/types.js";
import type { SearchResultItem } from "../../types/search.types.js";

const DEFAULT_VECTOR_DB_RETRIEVED_DOCUMENTS_LIMIT = 20;
const DEFAULT_VECTOR_DB_KEYWORD_LIMIT = 20;
const DEFAULT_TOP_K = 8;

export async function hybridSearch(
  query: string,
  userId: string,
  topK: number = DEFAULT_TOP_K,
): Promise<VectorSearchResult[]> {
  const vectorStore = getQdrantStore();
  const embeddingsModel = getEmbeddings();

  logger.debug({ query, userId }, "Starting hybrid search");
  const queryVector = await embeddingsModel.embedQuery(query);

  const [vectorResults, keywordResults] = await Promise.all([
    vectorStore.search(
      queryVector,
      DEFAULT_VECTOR_DB_RETRIEVED_DOCUMENTS_LIMIT,
      { userId },
    ),
    vectorStore.keywordSearch(query, DEFAULT_VECTOR_DB_KEYWORD_LIMIT, {
      userId,
    }),
  ]);

  logger.debug(
    {
      vectorCount: vectorResults.length,
      keywordCount: keywordResults.length,
    },
    "Search results retrieved",
  );

  const fused = reciprocalRankFusion(vectorResults, keywordResults);

  const topResults: VectorSearchResult[] = fused.slice(0, topK).map((r) => ({
    id: r.item.id,
    score: r.score,
    payload: r.item.payload,
  }));

  logger.debug({ topK: topResults.length }, "RRF merge complete");

  return topResults;
}

export function toSearchResultItems(
  results: VectorSearchResult[],
): SearchResultItem[] {
  return results.map((r) => ({
    id: r.id,
    title: r.payload.title,
    sourceType: r.payload.sourceType,
    sourceUrl: r.payload.sourceUrl,
    synopsis: r.payload.synopsis,
    relevanceScore: r.score,
  }));
}
