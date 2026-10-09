import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createDatabase } from "./client";

// Applies every pending migration in `migrationsFolder` (packages/db/drizzle) to the
// database at `url`. Used by the API's end-to-end tests to build a fresh test database,
// and usable by deploy scripts. `pnpm db:migrate` (drizzle-kit) does the same from the CLI.
export async function migrateDatabase(url: string, migrationsFolder: string): Promise<void> {
  const { db, close } = createDatabase(url, { maxConnections: 1 });
  try {
    await migrate(db, { migrationsFolder });
  } finally {
    await close();
  }
}
