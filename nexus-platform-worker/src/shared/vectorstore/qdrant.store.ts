import { QdrantClient } from "@qdrant/js-client-rest";
import { envConfig } from "../../config/env.js";
import { logger } from "../utils/logger.js";
import type { VectorStore } from "./vectorstore.interface.js";
import type {
  VectorFilter,
  VectorItem,
  VectorPayload,
  VectorSearchResult,
} from "./types.js";

const COLLECTION_NAME = "nexus_dev";
const VECTOR_SIZE = 1536;

export class QdrantStore implements VectorStore {
  private client: QdrantClient;

  constructor() {
    this.client = new QdrantClient({
      url: envConfig.QDRANT_ENDPOINT,
      apiKey: envConfig.QDRANT_API_KEY,
    });
  }

  async initialize(): Promise<void> {
    try {
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(
        (c) => c.name === COLLECTION_NAME,
      );

      if (!exists) {
        await this.client.createCollection(COLLECTION_NAME, {
          vectors: { size: VECTOR_SIZE, distance: "Cosine" },
        });

        await this.client.createPayloadIndex(COLLECTION_NAME, {
          field_name: "userId",
          field_schema: "keyword",
        });
        await this.client.createPayloadIndex(COLLECTION_NAME, {
          field_name: "sourceType",
          field_schema: "keyword",
        });
        await this.client.createPayloadIndex(COLLECTION_NAME, {
          field_name: "title",
          field_schema: "text",
        });
        await this.client.createPayloadIndex(COLLECTION_NAME, {
          field_name: "bodyText",
          field_schema: "text",
        });

        logger.info("Created Qdrant collection: %s", COLLECTION_NAME);
      } else {
        logger.info("Qdrant collection already exists: %s", COLLECTION_NAME);
      }
    } catch (err) {
      logger.error({ err }, "Failed to initialize Qdrant");
      throw err;
    }
  }

  async upsert(
    id: string,
    vector: number[],
    payload: VectorPayload,
  ): Promise<void> {
    await this.client.upsert(COLLECTION_NAME, {
      wait: true,
      points: [{ id, vector, payload }],
    });
  }

  async batchUpsert(items: VectorItem[]): Promise<void> {
    if (items.length === 0) return;

    await this.client.upsert(COLLECTION_NAME, {
      wait: true,
      points: items.map((item) => ({
        id: item.id,
        vector: item.vector,
        payload: item.payload,
      })),
    });
  }

  async search(
    vector: number[],
    limit: number,
    filter?: VectorFilter,
  ): Promise<VectorSearchResult[]> {
    const result = await this.client.search(COLLECTION_NAME, {
      vector,
      limit,
      with_payload: true,
      filter: this.buildFilter(filter),
    });

    return result.map((point) => ({
      id: String(point.id),
      score: point.score,
      payload: point.payload as unknown as VectorPayload,
    }));
  }

  async keywordSearch(
    query: string,
    limit: number,
    filter?: VectorFilter,
  ): Promise<VectorSearchResult[]> {
    const must: Record<string, unknown>[] = [];

    if (filter?.userId) {
      must.push({
        key: "userId",
        match: { value: filter.userId },
      });
    }
    if (filter?.sourceType) {
      must.push({
        key: "sourceType",
        match: { value: filter.sourceType },
      });
    }

    const should = [
      { key: "title", match: { text: query } },
      { key: "bodyText", match: { text: query } },
    ];

    const result = await this.client.scroll(COLLECTION_NAME, {
      limit,
      with_payload: true,
      with_vector: false,
      filter: {
        must,
        should,
      },
    });

    return result.points.map((point, index) => ({
      id: String(point.id),
      score: 1 / (index + 1), // Assign rank-based score for RRF
      payload: point.payload as unknown as VectorPayload,
    }));
  }

  async delete(id: string): Promise<void> {
    await this.client.delete(COLLECTION_NAME, {
      wait: true,
      points: [id],
    });
  }

  private buildFilter(
    filter?: VectorFilter,
  ): Record<string, unknown> | undefined {
    if (!filter) return undefined;

    const must: Record<string, unknown>[] = [];

    if (filter.userId) {
      must.push({ key: "userId", match: { value: filter.userId } });
    }
    if (filter.sourceType) {
      must.push({ key: "sourceType", match: { value: filter.sourceType } });
    }

    return must.length > 0 ? { must } : undefined;
  }
}

// Singleton
let _store: QdrantStore | null = null;

export function getQdrantStore(): QdrantStore {
  if (!_store) {
    _store = new QdrantStore();
  }
  return _store;
}
