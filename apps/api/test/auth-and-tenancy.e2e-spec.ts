import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { A } from "./fixtures";
import { createTestApp, type TestApp } from "./test-app";

// Real HTTP requests against the real API and a real (test) database.

describe("Auth, tenant isolation and the error format (e2e)", () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(async () => {
    await t.close();
  });

  it("GET /health is public and checks the database", async () => {
    const res = await t.api().get("/health").expect(200);
    expect(res.body).toMatchObject({ status: "ok", checks: { database: "up" } });
  });

  it("rejects a protected endpoint without a token, in the standard error shape", async () => {
    const res = await t.api().get("/v1/leads").expect(401);

    expect(res.body).toEqual({
      error: {
        statusCode: 401,
        code: "UNAUTHORIZED",
        message: "Missing bearer token",
        requestId: expect.any(String),
      },
    });
    // The same request ID is in the header, so a user's error can be traced in the logs.
    expect(res.headers["x-request-id"]).toBe(res.body.error.requestId);
  });

  it("rejects a wrong token", async () => {
    const res = await t.api().get("/v1/leads").set("Authorization", "Bearer not-the-token").expect(401);
    expect(res.body.error.message).toBe("Invalid token");
  });

  it("keeps a caller-supplied request ID (for tracing across services)", async () => {
    const res = await t.api().get("/health").set("X-Request-Id", "trace-abc-123");
    expect(res.headers["x-request-id"]).toBe("trace-abc-123");
  });

  it("GET /v1/me returns the business the token belongs to", async () => {
    const res = await t.asOwner.get("/v1/me").expect(200);
    expect(res.body).toEqual({ id: A.id, name: A.name, slug: A.slug, timeZone: "America/New_York" });
  });

  it("lists only this business's leads", async () => {
    const res = await t.asOwner.get("/v1/leads").expect(200);
    const names = res.body.items.map((lead: { name: string }) => lead.name);

    expect(names).toEqual(expect.arrayContaining(["Priya Shah", "Mark Chen", "Nina Brooks"]));
    expect(names).not.toContain("Bob Other"); // business B's lead
  });

  it("answers 404 (not 403) for another business's conversation, so its existence isn't revealed", async () => {
    const res = await t.asOwner.get(`/v1/conversations/${t.fixtures.other.conversationId}`).expect(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("can't approve another business's booking, and doesn't change it", async () => {
    await t.asOwner.post(`/v1/appointments/${t.fixtures.other.appointmentId}/approve`).expect(404);

    const res = await t.asOwner.get("/v1/appointments").expect(200);
    expect(res.body.items.map((a: { id: string }) => a.id)).not.toContain(t.fixtures.other.appointmentId);
  });

  it("returns 400 with per-field details for an invalid query", async () => {
    const res = await t.asOwner.get("/v1/leads?stage=nope").expect(400);

    expect(res.body.error).toMatchObject({ statusCode: 400, code: "BAD_REQUEST", message: "Validation failed" });
    expect(res.body.error.details).toEqual([expect.objectContaining({ path: "stage" })]);
  });

  it("returns 400 (not a database error) for a malformed ID", async () => {
    await t.asOwner.get("/v1/conversations/not-a-uuid").expect(400);
    await t.asOwner.post("/v1/appointments/not-a-uuid/approve").expect(400);
  });
});
