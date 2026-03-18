import { getRedisClient } from "../../shared/clients/redis.client.js";
import { envConfig } from "../../config/env.js";
import { logger } from "../../shared/utils/logger.js";
import { processIngestionJob } from "./ingestion.pipeline.js";
import { updateContentStatus } from "./db.service.js";

export interface IngestionJob {
  jobId: string;
  contentItemId: string;
  userId: string;
  sourceUrl: string;
  sourceType: string;
  step: string;
  attempt: number;
  createdAt: number;
}

const MAX_RETRIES = 3;
const BRPOP_TIMEOUT = 5; // seconds

let running = true;

export async function startConsumer(): Promise<void> {
  const redis = getRedisClient();
  const queueName = envConfig.CONTENT_QUEUE;
  const dlqName = envConfig.DEAD_LETTER_QUEUE;

  logger.info({ queueName }, "Starting content ingestion consumer");

  while (running) {
    try {
      const result = await redis.brpop(queueName, BRPOP_TIMEOUT);
      if (!result) continue; // timeout, check running flag and loop

      const [, rawPayload] = result;
      let job: IngestionJob;

      try {
        job = JSON.parse(rawPayload);
      } catch {
        logger.error({ rawPayload }, "Malformed job payload, skipping");
        continue;
      }

      logger.info(
        {
          jobId: job.jobId,
          contentItemId: job.contentItemId,
          attempt: job.attempt,
        },
        "Processing ingestion job",
      );

      try {
        await processIngestionJob(job);
        logger.info(
          { jobId: job.jobId, contentItemId: job.contentItemId },
          "Ingestion job completed",
        );
      } catch (err) {
        logger.error(
          {
            err,
            jobId: job.jobId,
            contentItemId: job.contentItemId,
            attempt: job.attempt,
          },
          "Ingestion job failed",
        );

        if (job.attempt < MAX_RETRIES) {
          // Re-enqueue with incremented attempt
          const retryJob = { ...job, attempt: job.attempt + 1 };
          await redis.lpush(queueName, JSON.stringify(retryJob));
          logger.info(
            {
              jobId: job.jobId,
              contentItemId: job.contentItemId,
              nextAttempt: retryJob.attempt,
            },
            "Re-enqueued for retry",
          );
        } else {
          // Move to dead letter queue and mark as FAILED
          const errorMsg = err instanceof Error ? err.message : String(err);
          await redis.lpush(
            dlqName,
            JSON.stringify({ ...job, error: errorMsg }),
          );
          await updateContentStatus(job.contentItemId, "FAILED", errorMsg);
          logger.warn(
            { jobId: job.jobId, contentItemId: job.contentItemId },
            "Moved to dead letter queue after max retries",
          );
        }
      }
    } catch (err) {
      // Unexpected error in consumer loop itself (Redis disconnect, etc.)
      logger.error({ err }, "Consumer loop error, backing off");
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  logger.info("Content ingestion consumer stopped");
}

export function stopConsumer(): void {
  running = false;
}
