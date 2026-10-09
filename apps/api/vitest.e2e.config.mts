import swc from "unplugin-swc";
import { defineConfig } from "vitest/config";

// End-to-end tests: the real API over HTTP (Supertest) against a real test database.
// Run with: pnpm test:e2e   (Postgres must be running: pnpm db:up)
export default defineConfig({
  test: {
    include: ["test/**/*.e2e-spec.ts"],
    environment: "node",
    // reflect-metadata for Nest's decorators; setup-env points the API at the test database.
    setupFiles: ["reflect-metadata", "./test/setup-env.ts"],
    // Creates frontpilot_test and applies all migrations, once, before any file runs.
    globalSetup: ["./test/global-setup.ts"],
    // Files share one database: run them one after another.
    fileParallelism: false,
    testTimeout: 15_000,
    hookTimeout: 30_000,
  },
  plugins: [swc.vite({ module: { type: "es6" } })],
});
