import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestApp, type TestApp } from "./test-app";

const valid = {
  agentName: "Ava",
  greeting: "Hello! What can we fix today?",
  tone: "professional",
  instructions: "Always mention our 1-year warranty.",
  tools: { answerQuestions: true, qualifyLeads: true, bookAppointments: false, followUps: false },
  approvalMode: "auto",
  suggestedQuestions: ["Emergency", "Get a quote"],
};

describe("Agent settings (e2e)", () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(async () => {
    await t.close();
  });

  it("returns the saved settings", async () => {
    const res = await t.asOwner.get("/v1/agent-settings").expect(200);
    expect(res.body).toMatchObject({ agentName: "Max", approvalMode: "review" });
  });

  it("rejects invalid settings with details for each field, and saves nothing", async () => {
    const res = await t.asOwner.put("/v1/agent-settings").send({ ...valid, tone: "rude", agentName: "" }).expect(400);

    const paths = res.body.error.details.map((d: { path: string }) => d.path);
    expect(paths).toEqual(expect.arrayContaining(["tone", "agentName"]));
    expect((await t.asOwner.get("/v1/agent-settings")).body.agentName).toBe("Max");
  });

  it("saves valid settings, and the public widget sees the new greeting", async () => {
    await t.asOwner.put("/v1/agent-settings").send(valid).expect(200);

    expect((await t.asOwner.get("/v1/agent-settings")).body).toEqual(valid);
    const widget = await t.api().get("/v1/widget/e2e-plumbing").expect(200);
    expect(widget.body.greeting).toBe(valid.greeting);
  });
});
