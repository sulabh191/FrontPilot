import { and, appointments, conversations, count, eq, leads, ne } from "@frontpilot/db";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { BookingService, type BookingRequest } from "../src/modules/appointments/booking.service";
import { AvailabilityService } from "../src/modules/availability/availability.service";
import { A, daysAhead, NY, nyTime } from "./fixtures";
import { createTestApp, type TestApp } from "./test-app";

// Double-booking protection has two layers:
//   1. code: BookingService re-checks availability before inserting;
//   2. database: a partial unique index allows one live booking per business per start time.
// These tests prove layer 2 holds even when layer 1 is fooled by a race.

describe("Double-booking guard (e2e, real database)", () => {
  let t: TestApp;
  let booking: BookingService;
  let availability: AvailabilityService;

  beforeAll(async () => {
    t = await createTestApp();
    booking = t.app.get(BookingService);
    availability = t.app.get(AvailabilityService);
  });
  afterAll(async () => {
    await t.close();
  });

  // Each booking comes from its own customer chat.
  const newChat = async () => {
    const [conversation] = await t.db.insert(conversations).values({ tenantId: A.id }).returning();
    return conversation!.id;
  };

  const request = (conversationId: string, days: number, time: string): BookingRequest => ({
    tenantId: A.id,
    conversationId,
    customerName: "Race Tester",
    phone: "(413) 555-0177",
    service: "Leak",
    date: daysAhead(days),
    time,
    address: "5 Race Rd",
    smsConsent: false,
    requireApproval: true,
  });

  const liveBookingsAt = async (startsAt: Date) =>
    (
      await t.db
        .select({ n: count() })
        .from(appointments)
        .where(
          and(eq(appointments.tenantId, A.id), eq(appointments.startsAt, startsAt), ne(appointments.status, "cancelled")),
        )
    )[0]!.n;

  it("the database refuses a second booking even when the availability check was passed", async () => {
    const slot = nyTime(6, "09:00");
    const first = await booking.book(request(await newChat(), 6, "09:00"));
    expect(first.ok).toBe(true);

    // Simulate the race: the second chat's check ran BEFORE the first booking was saved,
    // so it still believes 9:00 is free.
    const staleCheck = vi
      .spyOn(availability, "getSlots")
      .mockResolvedValueOnce({ status: "open", timeZone: NY, slots: [slot] });
    const secondChat = await newChat();

    const second = await booking.book(request(secondChat, 6, "09:00"));

    expect(staleCheck).toHaveBeenCalled();
    expect(second).toEqual({ ok: false, reason: "That time was just taken. Check availability again." });
    expect(await liveBookingsAt(slot)).toBe(1);
    // The transaction rolled back completely: no orphan lead for the losing chat.
    const orphanLeads = await t.db.select({ n: count() }).from(leads).where(eq(leads.conversationId, secondChat));
    expect(orphanLeads[0]!.n).toBe(0);
    staleCheck.mockRestore();
  });

  it("two chats booking the same slot at the same moment: exactly one wins", async () => {
    const [chat1, chat2] = [await newChat(), await newChat()];

    const results = await Promise.all([
      booking.book(request(chat1, 6, "11:00")),
      booking.book(request(chat2, 6, "11:00")),
    ]);

    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(await liveBookingsAt(nyTime(6, "11:00"))).toBe(1);
  });

  it("a cancelled booking doesn't block the slot (the index only counts live bookings)", async () => {
    await t.db.insert(appointments).values({
      tenantId: A.id,
      customerName: "Declined Earlier",
      service: "Leak",
      startsAt: nyTime(7, "09:00"),
      status: "cancelled",
    });

    const result = await booking.book(request(await newChat(), 7, "09:00"));

    expect(result.ok).toBe(true);
  });

  it("the same time at a different business is fine (the guard is per business)", async () => {
    // Fixtures already have business B booked at day 2, 10:00; A's own fixture booking is there too.
    const rows = await t.db
      .select({ n: count() })
      .from(appointments)
      .where(and(eq(appointments.startsAt, nyTime(2, "10:00")), ne(appointments.status, "cancelled")));
    expect(rows[0]!.n).toBe(2);
  });
});
