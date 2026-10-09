// Settings for the end-to-end tests. They run against their own database
// (frontpilot_test on the same Postgres), never the development one.
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgres://frontpilot:frontpilot@localhost:5433/frontpilot_test";

// Same server, maintenance database: used only to drop/create the test database.
export const ADMIN_DATABASE_URL = (() => {
  const url = new URL(TEST_DATABASE_URL);
  url.pathname = "/postgres";
  return url.toString();
})();

export const TEST_TOKEN = "e2e-test-token-0123456789";
export const TRUSTED_ORIGIN = "http://localhost:3000";

// Environment the API boots with during e2e tests (set before AppModule validates it).
// These win over apps/api/.env.local, so tests never use real keys or the dev database.
export const testEnv = {
  NODE_ENV: "test",
  DATABASE_URL: TEST_DATABASE_URL,
  DEV_AUTH_TOKEN: TEST_TOKEN,
  DEV_TENANT_SLUG: "e2e-plumbing",
  CORS_ORIGINS: TRUSTED_ORIGIN,
  SMS_PROVIDER: "console", // replaced by a fake in tests anyway
  ANTHROPIC_API_KEY: "not-a-real-key", // the model is replaced by a fake in tests
};
