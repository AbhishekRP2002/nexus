import type {
  VectorFilter,
  VectorItem,
  VectorPayload,
  VectorSearchResult,
} from "./types.js";

export interface VectorStore {
  initialize(): Promise<void>;
  upsert(id: string, vector: number[], payload: VectorPayload): Promise<void>;
  batchUpsert(items: VectorItem[]): Promise<void>;
  search(
    vector: number[],
    limit: number,
    filter?: VectorFilter,
  ): Promise<VectorSearchResult[]>;
  keywordSearch(
    query: string,
    limit: number,
    filter?: VectorFilter,
  ): Promise<VectorSearchResult[]>;
  delete(id: string): Promise<void>;
}
