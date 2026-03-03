import { z } from "zod";

export const searchQuerySchema = z.object({
  q: z
    .string()
    .min(1, "Search query is required")
    .describe("user input search query string."),
  userId: z
    .string()
    .min(1, "userId is required")
    .describe(
      "ID of the user performing the search, used to scope the search to their content.",
    ),
  limit: z.coerce.number().min(1).max(20).optional().default(8),
});

export const citationSourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  sourceType: z.string(),
  sourceUrl: z.string(),
});

export const searchResultItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  sourceType: z.string(),
  sourceUrl: z.string(),
  synopsis: z.string().optional(),
  relevanceScore: z.number(),
});

export const searchResponseSchema = z.object({
  query: z.string(),
  results: z.array(searchResultItemSchema),
  totalResults: z.number(),
});

export const errorResponseSchema = z.object({
  error: z.record(z.string(), z.array(z.string())),
});

export type SearchRequest = z.infer<typeof searchQuerySchema>;
export type CitationSource = z.infer<typeof citationSourceSchema>;
export type SearchResultItem = z.infer<typeof searchResultItemSchema>;
export type SearchResponse = z.infer<typeof searchResponseSchema>;

export interface AiResponsePayload {
  response: string;
  citations: Record<string, CitationSource>;
  followUpQuestions: string[];
}

export type SearchStreamEventType =
  | "status"
  | "sources"
  | "response-delta"
  | "citations"
  | "follow-up"
  | "error"
  | "done";

export interface SearchStreamEvent {
  event: SearchStreamEventType;
  data: unknown;
}
