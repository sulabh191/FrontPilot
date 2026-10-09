import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { createDatabase } from "@frontpilot/db";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/app.setup";
import { LLM_CLIENT } from "../src/modules/agent/llm/llm.constants";
import { SMS_PROVIDER } from "../src/modules/notifications/sms-provider";
import { FakeLlm, FakeSms } from "./fakes";
import { resetFixtures } from "./fixtures";
import { TEST_DATABASE_URL, TEST_TOKEN } from "./test-env";

// Boots the REAL API (every module, guard, pipe, filter and the real test database),
// replacing only the two things that leave the building: Claude and SMS.
export async function createTestApp() {
  const llm = new FakeLlm();
  const sms = new FakeSms();

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(LLM_CLIENT)
    .useValue(llm)
    .overrideProvider(SMS_PROVIDER)
    .useValue(sms)
    .compile();

  const app: INestApplication = moduleRef.createNestApplication({ logger: false });
  configureApp(app); // same error format + CORS as production
  await app.init();

  // A separate connection for tests to arrange data and check results.
  const database = createDatabase(TEST_DATABASE_URL, { maxConnections: 2 });
  const fixtures = await resetFixtures(database.db);

  const http = app.getHttpServer();
  return {
    app,
    llm,
    sms,
    db: database.db,
    fixtures,
    // Requests as the dashboard (with the business's token) or as the public.
    api: () => request(http),
    asOwner: {
      get: (path: string) => request(http).get(path).set("Authorization", `Bearer ${TEST_TOKEN}`),
      post: (path: string) => request(http).post(path).set("Authorization", `Bearer ${TEST_TOKEN}`),
      put: (path: string) => request(http).put(path).set("Authorization", `Bearer ${TEST_TOKEN}`),
    },
    close: async () => {
      await app.close();
      await database.close();
    },
  };
}

export type TestApp = Awaited<ReturnType<typeof createTestApp>>;

// POST /v1/chat and read the NDJSON stream into a list of events.
export async function postChat(testApp: TestApp, body: Record<string, unknown>) {
  const res = await testApp
    .api()
    .post("/v1/chat")
    .send(body)
    .buffer(true)
    .parse((stream: any, done: (error: Error | null, body: string) => void) => {
      let raw = "";
      stream.setEncoding("utf8");
      stream.on("data", (chunk: string) => (raw += chunk));
      stream.on("end", () => done(null, raw));
    });

  const raw = res.body as string;
  const lines = raw.trim() ? raw.trim().split("\n").map((line) => JSON.parse(line)) : [];
  return {
    status: res.status,
    contentType: res.headers["content-type"] as string | undefined,
    events: res.status === 200 ? (lines as { type: string; [key: string]: unknown }[]) : [],
    error: res.status === 200 ? null : (lines[0] as { error: { statusCode: number; code: string; message: string } }),
  };
}
