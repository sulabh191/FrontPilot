import { appointments, conversations, eq, leads } from "@frontpilot/db";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { daysAhead, nyTime } from "./fixtures";
import { createTestApp, type TestApp } from "./test-app";

describe("Appointments: listing, approvals and availability (e2e)", () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(async () => {
    await t.close();
  });

  const slotTimes = (body: { slots: { startsAt: string }[] }) => body.slots.map((slot) => slot.startsAt);

  const statusOf = async (table: "appointment" | "lead" | "conversation", id: string) => {
    if (table === "appointment") {
      const [row] = await t.db.select({ s: appointments.status }).from(appointments).where(eq(appointments.id, id));
      return row?.s;
    }
    if (table === "lead") {
      const [row] = await t.db.select({ s: leads.stage }).from(leads).where(eq(leads.id, id));
      return row?.s;
    }
    const [row] = await t.db.select({ s: conversations.status }).from(conversations).where(eq(conversations.id, id));
    return row?.s;
  };

  it("lists appointments soonest first, with the business time zone", async () => {
    const res = await t.asOwner.get("/v1/appointments").expect(200);

    expect(res.body.timeZone).toBe("America/New_York");
    const starts = res.body.items.map((a: { startsAt: string }) => a.startsAt);
    expect(starts).toEqual([...starts].sort());
    expect(starts[0]).toBe(nyTime(2, "10:00").toISOString()); // stored in UTC
  });

  it("approving confirms the booking, closes the chat and texts the customer", async () => {
    const { appointmentId, leadId, conversationId } = t.fixtures.approveMe;

    const res = await t.asOwner.post(`/v1/appointments/${appointmentId}/approve`).expect(200);

    expect(res.body).toEqual({ id: appointmentId, status: "confirmed" });
    expect(await statusOf("appointment", appointmentId)).toBe("confirmed");
    expect(await statusOf("lead", leadId)).toBe("booked");
    expect(await statusOf("conversation", conversationId)).toBe("resolved_by_owner");
    expect(t.sms.sent).toEqual([
      { to: "+14135550123", body: expect.stringContaining("your E2E Plumbing visit (Leaking sink) is confirmed") },
    ]);
  });

  it("approving the same booking again is a 409 conflict, with no second text", async () => {
    const res = await t.asOwner.post(`/v1/appointments/${t.fixtures.approveMe.appointmentId}/approve`).expect(409);

    expect(res.body.error.code).toBe("CONFLICT");
    expect(res.body.error.message).toContain("already handled");
    expect(t.sms.sent).toHaveLength(1);
  });

  it("declining cancels the booking, sends the lead back to Qualified and flags the chat", async () => {
    const { appointmentId, leadId, conversationId } = t.fixtures.declineMe;

    await t.asOwner.post(`/v1/appointments/${appointmentId}/decline`).expect(200);

    expect(await statusOf("appointment", appointmentId)).toBe("cancelled");
    expect(await statusOf("lead", leadId)).toBe("qualified");
    expect(await statusOf("conversation", conversationId)).toBe("needs_owner");
  });

  it("a declined slot becomes bookable again", async () => {
    const res = await t.asOwner.get(`/v1/availability?date=${daysAhead(3)}`).expect(200);
    expect(slotTimes(res.body)).toContain(nyTime(3, "10:00").toISOString());
  });

  it("booked slots are not offered", async () => {
    const res = await t.asOwner.get(`/v1/availability?date=${daysAhead(4)}`).expect(200);

    expect(slotTimes(res.body)).not.toContain(nyTime(4, "11:00").toISOString()); // confirmed booking
    expect(slotTimes(res.body)).toContain(nyTime(4, "10:00").toISOString());
  });

  it("two owners deciding at the same moment: exactly one wins, the other gets 409", async () => {
    const id = t.fixtures.raceMe.appointmentId;

    const results = await Promise.all([
      t.asOwner.post(`/v1/appointments/${id}/approve`),
      t.asOwner.post(`/v1/appointments/${id}/decline`),
    ]);

    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    const winner = results.find((r) => r.status === 200)!;
    expect(await statusOf("appointment", id)).toBe(winner.body.status);
  });
});
