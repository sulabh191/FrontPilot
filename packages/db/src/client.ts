import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Creates a connection pool + Drizzle instance for the given URL.
// Apps own the lifecycle: the API creates one at startup and closes it on shutdown.
export function createDatabase(url: string, options: { maxConnections?: number } = {}) {
  const client = postgres(url, { max: options.maxConnections ?? 10 });
  const db = drizzle(client, { schema });
  return { db, close: () => client.end() };
}

export type Database = ReturnType<typeof createDatabase>["db"];

// Used by the Next.js app until it stops talking to the database directly.
// Reuses one pool across dev hot-reloads.
const globalForDb = globalThis as unknown as { __frontpilotDb?: Database };

export function getDb(): Database {
  if (!globalForDb.__frontpilotDb) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set.");
    globalForDb.__frontpilotDb = createDatabase(url).db;
  }
  return globalForDb.__frontpilotDb;
}
