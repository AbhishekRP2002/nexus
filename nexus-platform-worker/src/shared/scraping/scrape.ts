import Firecrawl from "@mendable/firecrawl-js";
import Exa from "exa-js";
import { envConfig } from "../../config/env.js";
import { logger } from "../utils/logger.js";

export type ScrapingProvider = "firecrawl" | "exa";

export interface WebPageScrapedContent {
  title: string;
  author?: string;
  bodyText: string;
  rawHtml?: string;
  publishedAt?: string;
  sourceUrl: string;
  scrapedBy: ScrapingProvider;
}

export interface ScrapingConfigOptions {
  provider?: ScrapingProvider;
  skipFallback?: boolean;
}

const clients = {
  firecrawl: null as Firecrawl | null,
  exa: null as Exa | null,
};

function getWebScraperClient(provider: ScrapingProvider): Firecrawl | Exa {
  if (provider === "firecrawl") {
    if (!clients.firecrawl) {
      clients.firecrawl = new Firecrawl({
        apiKey: envConfig.FIRECRAWL_API_KEY,
      });
    }
    return clients.firecrawl;
  }

  if (!envConfig.EXA_API_KEY) {
    throw new Error("EXA_API_KEY is not configured");
  }
  if (!clients.exa) {
    clients.exa = new Exa(envConfig.EXA_API_KEY);
  }
  return clients.exa;
}

async function scrapeWith(
  provider: ScrapingProvider,
  url: string,
): Promise<WebPageScrapedContent> {
  if (provider === "firecrawl") {
    const client = getWebScraperClient("firecrawl") as Firecrawl;
    const result = await client.scrape(url, {
      formats: ["markdown", "html"],
    });

    if (!result.markdown) {
      throw new Error("Firecrawl returned no markdown content");
    }

    const meta = result.metadata;
    return {
      title: (meta?.title as string) || "Untitled",
      author: meta?.author as string | undefined,
      bodyText: result.markdown,
      rawHtml: result.html,
      publishedAt: meta?.publishedAt as string | undefined,
      sourceUrl: url,
      scrapedBy: "firecrawl",
    };
  }

  const client = getWebScraperClient("exa") as Exa;
  const result = await client.getContents([url], { text: true });
  const page = result.results?.[0];

  if (!page?.text) {
    throw new Error("Exa returned no text content");
  }

  return {
    title: page.title || "Untitled",
    author: page.author ?? undefined,
    bodyText: page.text,
    publishedAt: page.publishedDate ?? undefined,
    sourceUrl: url,
    scrapedBy: "exa",
  };
}

const PROVIDER_CHAIN: ScrapingProvider[] = ["firecrawl", "exa"];

function getAvailableProviders(): ScrapingProvider[] {
  const available: ScrapingProvider[] = ["firecrawl"]; // always available (required key)
  if (envConfig.EXA_API_KEY) available.push("exa");
  return available;
}

/**
 * Scrapes a URL and returns clean markdown + metadata.
 *
 * Default strategy: walks the provider chain (Firecrawl → Exa) until one
 * succeeds. Override with `options.provider` to target a specific provider,
 * or set `options.skipFallback` to disable the chain.
 *
 * Shared primitive used across all ingestion sources:
 *  - Direct URL submission (web)
 *  - Linked URLs from tweets
 *  - Linked URLs from Reddit posts
 */
export async function scrapeUrl(
  url: string,
  options?: ScrapingConfigOptions,
): Promise<WebPageScrapedContent> {
  if (options?.provider) {
    const result = await scrapeWith(options.provider, url);
    logger.info({ url, scrapedBy: options.provider }, "Scrape successful");
    return result;
  }

  const providers = options?.skipFallback
    ? [PROVIDER_CHAIN[0]]
    : PROVIDER_CHAIN.filter((p) => getAvailableProviders().includes(p));

  let lastError: Error | undefined;

  for (const provider of providers) {
    try {
      const result = await scrapeWith(provider, url);
      logger.info({ url, scrapedBy: provider }, "Scrape successful");
      return result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      logger.warn(
        { err: lastError, url, provider },
        `Scrape failed with ${provider}${providers.indexOf(provider) < providers.length - 1 ? ", trying next provider" : ""}`,
      );
    }
  }

  throw new Error(
    `All scraping providers failed for ${url}: ${lastError?.message}`,
  );
}
