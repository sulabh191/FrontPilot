import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestApp, postChat, type TestApp } from "./test-app";
import { TRUSTED_ORIGIN } from "./test-env";

// A fresh app (and so a fresh rate-limit counter) just for these tests.

describe("Rate limiting and CORS (e2e)", () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(async () => {
    await t.close();
  });

  describe("CORS", () => {
    const preflight = (path: string, origin: string) =>
      t.api().options(path).set("Origin", origin).set("Access-Control-Request-Method", "POST");

    it("lets ANY website call the public chat, without cookies", async () => {
      const res = await preflight("/v1/chat", "https://any-plumber.example");

      expect(res.headers["access-control-allow-origin"]).toBe("https://any-plumber.example");
      expect(res.headers["access-control-allow-credentials"]).toBeUndefined();
    });

    it("lets our own dashboard call private endpoints", async () => {
      const res = await preflight("/v1/leads", TRUSTED_ORIGIN);

      expect(res.headers["access-control-allow-origin"]).toBe(TRUSTED_ORIGIN);
      expect(res.headers["access-control-allow-credentials"]).toBe("true");
    });

    it("doesn't let other websites call private endpoints from a browser", async () => {
      const res = await preflight("/v1/leads", "https://evil.example");
      expect(res.headers["access-control-allow-origin"]).toBeUndefined();
    });
  });

  describe("rate limit on POST /v1/chat", () => {
    it("allows 20 messages a minute per visitor, then answers 429 without calling the model", async () => {
      // Unknown business: each request is a cheap 404 that never reaches the model.
      const statuses: number[] = [];
      for (let i = 0; i < 22; i++) {
        statuses.push((await postChat(t, { tenantSlug: "no-such-business", message: "hi" })).status);
      }

      expect(statuses.slice(0, 20).every((s) => s === 404)).toBe(true);
      expect(statuses.slice(20)).toEqual([429, 429]);
      expect(t.llm.calls).toHaveLength(0);
    });

    it("counts invalid requests too (the limit runs before validation)", async () => {
      const { status, error } = await postChat(t, { message: "" });

      expect(status).toBe(429);
      expect(error!.error.code).toBe("TOO_MANY_REQUESTS");
    });
  });
});
