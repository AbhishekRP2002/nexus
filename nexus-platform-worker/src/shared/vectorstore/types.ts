export interface VectorPayload {
  userId: string;
  title: string;
  sourceType: string;
  sourceUrl: string;
  synopsis?: string;
  keyInsights?: string[];
  bodyText?: string;
  savedAt?: string;
  [key: string]: unknown;
}

export interface VectorSearchResult {
  id: string;
  score: number;
  payload: VectorPayload;
}

export interface VectorFilter {
  userId: string;
  sourceType?: string;
}

export interface VectorItem {
  id: string;
  vector: number[];
  payload: VectorPayload;
}
