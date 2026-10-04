import { defineConfig } from "drizzle-kit";

// Locally, reuse the web app's private env file so DATABASE_URL lives in one place.
// In CI or production, DATABASE_URL is set in the environment instead.
try {
  process.loadEnvFile("../../apps/web/.env.local");
} catch {
  // file not present: rely on the environment
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle", // generated SQL migrations, committed to Git
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL },
  strict: true,
});
