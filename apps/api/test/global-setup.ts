import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { createDatabase, migrateDatabase, sql } from "@frontpilot/db";
import { ADMIN_DATABASE_URL, TEST_DATABASE_URL } from "./test-env";

// Runs ONCE before all e2e test files: a brand-new test database with every migration applied.
export default async function setup() {
  const name = new URL(TEST_DATABASE_URL).pathname.slice(1);

  // Safety net: this drops a database, so refuse anything that isn't clearly a test database.
  if (!/^[a-z0-9_]+_test$/.test(name)) {
    throw new Error(`Refusing to reset "${name}": e2e tests only run on a database whose name ends in _test.`);
  }

  const admin = createDatabase(ADMIN_DATABASE_URL, { maxConnections: 1 });
  try {
    const existing = await admin.db.execute(sql`select 1 from pg_database where datname = ${name}`);
    if (existing.length) await admin.db.execute(sql.raw(`DROP DATABASE "${name}" WITH (FORCE)`));
    await admin.db.execute(sql.raw(`CREATE DATABASE "${name}"`));
  } finally {
    await admin.close();
  }

  // The same migration files as development and production: the schema can't drift.
  // Tests run from apps/api (pnpm --filter / turbo), so the folder is two levels up.
  const migrationsFolder = resolve(process.cwd(), "../../packages/db/drizzle");
  if (!existsSync(migrationsFolder)) throw new Error(`Migrations not found at ${migrationsFolder}`);
  await migrateDatabase(TEST_DATABASE_URL, migrationsFolder);
}
