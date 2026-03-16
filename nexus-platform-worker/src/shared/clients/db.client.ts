import postgres from "postgres";
import { envConfig } from "../../config/env.js";

let _sql: ReturnType<typeof postgres> | null = null;

export function getDb() {
  if (!_sql) {
    _sql = postgres(envConfig.DATABASE_URL, {
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }
  return _sql;
}

export async function closeDb(): Promise<void> {
  if (_sql) {
    await _sql.end();
    _sql = null;
  }
}
