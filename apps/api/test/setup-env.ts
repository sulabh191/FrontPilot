import { testEnv } from "./test-env";

// Runs in every e2e worker BEFORE any test file is loaded, so when a test imports
// AppModule, its config validation already sees the test database and test secrets.
// (These win over apps/api/.env.local, which @nestjs/config never overrides.)
Object.assign(process.env, testEnv);
