import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { describeRoute, resolver, validator } from "hono-openapi";
import { hybridSearch, toSearchResultItems } from "./search.service.js";
import { generateAiResponse } from "./ai-response.service.js";
import { logger } from "../../shared/utils/logger.js";
import {
  searchQuerySchema,
  searchResponseSchema,
  errorResponseSchema,
} from "../../types/search.types.js";
import {
  rateLimiter,
  getDeduplicationKey,
  getInFlight,
  setInFlight,
} from "../../shared/middleware/rate-limiter.js";

export const searchRoutes = new Hono();

searchRoutes.use("/*", rateLimiter);

/**
 * GET /api/search?q={query}&userId={userId}
 * Returns ranked results immediately (no AI response).
 */
searchRoutes.get(
  "/",
  describeRoute({
    tags: ["Search"],
    summary: "Search knowledge base",
    description:
      "Performs hybrid search (vector + keyword) across the user's saved content and returns ranked results.",
    responses: {
      200: {
        description: "Ranked search results",
        content: {
          "application/json": { schema: resolver(searchResponseSchema) },
        },
      },
      400: {
        description: "Validation error",
        content: {
          "application/json": { schema: resolver(errorResponseSchema) },
        },
      },
    },
  }),
  validator("query", searchQuerySchema),
  async (c) => {
    const { q, userId, limit } = c.req.valid("query");

    const results = await hybridSearch(q, userId, limit);

    return c.json({
      query: q,
      results: toSearchResultItems(results),
      totalResults: results.length,
    });
  },
);

/**
 * GET /api/search/stream?q={query}&userId={userId}
 * SSE stream: sources → response-delta(s) → citations → follow-ups → done
 */
searchRoutes.get(
  "/stream",
  describeRoute({
    tags: ["Search"],
    summary: "Stream AI-synthesized search response",
    description: `Performs hybrid search then streams an AI-synthesized response via Server-Sent Events.

**SSE event sequence:**
1. \`status\` — { phase: "Retrieving relevant content" | "Generating AI response" }
2. \`sources\` — { results: SearchResultItem[] }
3. \`response-delta\` — { delta: string } (word-by-word response chunks)
4. \`citations\` — { citations: Record<string, CitationSource> }
5. \`follow-up\` — { questions: string[] }
6. \`done\` — {}
7. \`error\` (on failure) — { message: string }`,
    responses: {
      200: {
        description: "SSE event stream",
        content: { "text/event-stream": {} },
      },
      400: {
        description: "Validation error",
        content: {
          "application/json": { schema: resolver(errorResponseSchema) },
        },
      },
    },
  }),
  validator("query", searchQuerySchema),
  async (c) => {
    const { q, userId, limit } = c.req.valid("query");

    const dedupKey = getDeduplicationKey(userId, q);
    const existing = getInFlight(dedupKey);
    if (existing) {
      logger.debug({ dedupKey }, "Reusing in-flight search request");
      return existing.promise;
    }

    const responsePromise = streamSSE(c, async (stream) => {
      try {
        await stream.writeSSE({
          event: "status",
          data: JSON.stringify({ phase: "Retrieving relevant content" }),
        });

        const results = await hybridSearch(q, userId, limit);

        await stream.writeSSE({
          event: "sources",
          data: JSON.stringify({
            results: toSearchResultItems(results),
          }),
        });

        if (results.length === 0) {
          await stream.writeSSE({
            event: "response-delta",
            data: JSON.stringify({
              delta:
                "I couldn't find any relevant content in your knowledge base for this query. Try adding more content or rephrasing your question.",
            }),
          });
          await stream.writeSSE({ event: "done", data: "{}" });
          return;
        }

        await stream.writeSSE({
          event: "status",
          data: JSON.stringify({ phase: "Generating AI response" }),
        });

        const { response, citations, followUpQuestions } =
          await generateAiResponse(q, results);

        // Stream the response word-by-word with small delays
        // to create a visible typing effect on the frontend.
        const words = response.split(/(\s+)/);
        const CHUNK_SIZE = 3;
        const CHUNK_DELAY_MS = 30;
        for (let i = 0; i < words.length; i += CHUNK_SIZE) {
          const chunk = words.slice(i, i + CHUNK_SIZE).join("");
          await stream.writeSSE({
            event: "response-delta",
            data: JSON.stringify({ delta: chunk }),
          });
          if (i + CHUNK_SIZE < words.length) {
            await new Promise((r) => setTimeout(r, CHUNK_DELAY_MS));
          }
        }

        await stream.writeSSE({
          event: "citations",
          data: JSON.stringify({ citations }),
        });

        await stream.writeSSE({
          event: "follow-up",
          data: JSON.stringify({ questions: followUpQuestions }),
        });

        await stream.writeSSE({ event: "done", data: "{}" });
      } catch (err) {
        logger.error({ err }, "Search stream error");
        await stream.writeSSE({
          event: "error",
          data: JSON.stringify({ message: "Search failed" }),
        });
        await stream.writeSSE({ event: "done", data: "{}" });
      }
    });

    setInFlight(dedupKey, responsePromise);
    return responsePromise;
  },
);
