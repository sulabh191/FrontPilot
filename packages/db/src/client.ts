import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Add it to apps/web/.env.local.");
  const sql = postgres(url, { max: 10 }); // connection pool
  return drizzle(sql, { schema });
}

export type Database = ReturnType<typeof createDb>;

// Reuse one pool across dev hot-reloads instead of opening new connections each time.
const globalForDb = globalThis as unknown as { __frontpilotDb?: Database };

export function getDb(): Database {
  globalForDb.__frontpilotDb ??= createDb();
  return globalForDb.__frontpilotDb;
}
