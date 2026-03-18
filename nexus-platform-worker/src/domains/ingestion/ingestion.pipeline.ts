import type { IngestionJob } from "./queue.consumer.js";
import { updateContentStatus } from "./db.service.js";
import { logger } from "../../shared/utils/logger.js";

/**
 * Main pipeline orchestrator. Called by the queue consumer for each job.
 * Runs: Extract → Distill → Embed+Upsert → Ready
 *
 * Each step is implemented in its own service file (Phases 4-6).
 * For now, stubs are in place — they'll be replaced with real implementations.
 */
export async function processIngestionJob(job: IngestionJob): Promise<void> {
  const { contentItemId } = job;

  // Step 1: Extract content from URL
  await updateContentStatus(contentItemId, "EXTRACTING");
  logger.info(
    { contentItemId, sourceUrl: job.sourceUrl },
    "Starting extraction",
  );

  // TODO: Phase 4 — wire extractContent(job.sourceUrl)
  // const extracted = await extractContent(job.sourceUrl);
  // await updateContentExtracted(contentItemId, extracted);

  // Step 2: Distill with LLM
  // await updateContentStatus(contentItemId, "DISTILLING");
  // const distilled = await distillContent({ title: extracted.title, ... });
  // await updateContentDistilled(contentItemId, distilled);

  // Step 3: Embed + Qdrant upsert
  // await updateContentStatus(contentItemId, "ORGANIZING");
  // const vector = await getEmbeddings().embedQuery(textToEmbed);
  // await getQdrantStore().upsert(contentItemId, vector, payload);

  // Step 4: Mark ready
  // await updateContentReady(contentItemId, distilled.suggestedCategory);

  // Temporary: mark as READY to verify the pipeline runs end-to-end
  await updateContentStatus(contentItemId, "READY");
  logger.info({ contentItemId }, "Pipeline stub completed — marked READY");
}
