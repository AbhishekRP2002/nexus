import { getDb } from "../../shared/clients/db.client.js";
import { logger } from "../../shared/utils/logger.js";

export async function updateContentStatus(
  contentItemId: string,
  status: string,
  errorMessage?: string,
) {
  const sql = getDb();
  await sql`
    UPDATE content_items
    SET status = ${status},
        error_message = ${errorMessage ?? null},
        updated_at = NOW()
    WHERE id = ${contentItemId}::uuid
  `;
  logger.debug({ contentItemId, status }, "Status updated");
}

export async function updateContentExtracted(
  contentItemId: string,
  data: {
    title: string;
    author?: string;
    bodyText: string;
    rawHtml?: string;
  },
) {
  const sql = getDb();
  await sql`
    UPDATE content_items
    SET title = ${data.title},
        author = ${data.author ?? null},
        body_text = ${data.bodyText},
        raw_html = ${data.rawHtml ?? null},
        status = 'EXTRACTED',
        updated_at = NOW()
    WHERE id = ${contentItemId}::uuid
  `;
}

export async function updateContentDistilled(
  contentItemId: string,
  data: {
    synopsis: object;
    keyInsights: string[];
    entities: object[];
    tags: string[];
  },
) {
  const sql = getDb();
  await sql`
    UPDATE content_items
    SET synopsis = ${JSON.stringify(data.synopsis)}::jsonb,
        key_insights = ${JSON.stringify(data.keyInsights)}::jsonb,
        entities = ${JSON.stringify(data.entities)}::jsonb,
        tags = ${JSON.stringify(data.tags)}::jsonb,
        status = 'DISTILLED',
        updated_at = NOW()
    WHERE id = ${contentItemId}::uuid
  `;
}

export async function updateContentReady(
  contentItemId: string,
  category?: string,
) {
  const sql = getDb();
  await sql`
    UPDATE content_items
    SET status = 'READY',
        category = ${category ?? null},
        updated_at = NOW()
    WHERE id = ${contentItemId}::uuid
  `;
}
