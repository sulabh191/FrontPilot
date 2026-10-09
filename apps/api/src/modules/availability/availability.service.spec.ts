import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AvailabilityRepository } from "./availability.repository";
import { AvailabilityService } from "./availability.service";

// The service is real; its repository is a FAKE swapped in through Nest's DI.
// No database is needed, and every test controls exactly what "the database" returns.

const TENANT = "tenant-1";
const NY = "America/New_York";

// Like the demo business: Mon–Fri 7–19, Sat 8–16, closed Sunday, 60-minute visits.
const schedule = {
  timeZone: NY,
  appointmentMinutes: 60,
  openingHours: {
    mon: { open: "07:00", close: "19:00" },
    tue: { open: "07:00", close: "19:00" },
    wed: { open: "07:00", close: "19:00" },
    thu: { open: "07:00", close: "19:00" },
    fri: { open: "07:00", close: "19:00" },
    sat: { open: "08:00", close: "16:00" },
    sun: null,
  },
};

// "Now" for every test: Monday 2026-10-12, 8:00 AM in New York.
const NOW = new Date("2026-10-12T12:00:00Z");

// Local New York time on a date → the UTC instant the service works with.
const at = (date: string, hhmm: string) => new Date(`${date}T${hhmm}:00-04:00`);

describe("AvailabilityService", () => {
  let service: AvailabilityService;
  const repo = {
    schedule: vi.fn(),
    bookedBetween: vi.fn(),
  };

  beforeEach(async () => {
    repo.schedule.mockResolvedValue(schedule);
    repo.bookedBetween.mockResolvedValue([]);

    const moduleRef = await Test.createTestingModule({
      providers: [AvailabilityService, { provide: AvailabilityRepository, useValue: repo }],
    }).compile();
    service = moduleRef.get(AvailabilityService);
  });

  it("offers every hour of a normal weekday", async () => {
    const result = await service.getSlots(TENANT, "2026-10-13", NOW);

    expect(result.status).toBe("open");
    if (result.status !== "open") return;
    expect(result.timeZone).toBe(NY);
    expect(result.slots).toHaveLength(12); // 7:00 … 18:00 (the last visit must end by 19:00)
    expect(result.slots[0]).toEqual(at("2026-10-13", "07:00"));
    expect(result.slots.at(-1)).toEqual(at("2026-10-13", "18:00"));
  });

  it("requires 60 minutes' notice today", async () => {
    const result = await service.getSlots(TENANT, "2026-10-12", NOW); // it's 8:00 AM

    if (result.status !== "open") throw new Error("expected open");
    expect(result.slots[0]).toEqual(at("2026-10-12", "09:00")); // 7:00 and 8:00 are too soon
    expect(result.slots).toHaveLength(10);
  });

  it("uses Saturday's shorter hours", async () => {
    const result = await service.getSlots(TENANT, "2026-10-17", NOW);

    if (result.status !== "open") throw new Error("expected open");
    expect(result.slots).toHaveLength(8); // 8:00 … 15:00
    expect(result.slots[0]).toEqual(at("2026-10-17", "08:00"));
  });

  it("removes booked slots", async () => {
    repo.bookedBetween.mockResolvedValue([{ startsAt: at("2026-10-13", "10:00") }]);

    const result = await service.getSlots(TENANT, "2026-10-13", NOW);

    if (result.status !== "open") throw new Error("expected open");
    expect(result.slots).toHaveLength(11);
    expect(result.slots).not.toContainEqual(at("2026-10-13", "10:00"));
  });

  it("removes both slots a half-hour booking overlaps", async () => {
    repo.bookedBetween.mockResolvedValue([{ startsAt: at("2026-10-13", "10:30") }]);

    const result = await service.getSlots(TENANT, "2026-10-13", NOW);

    if (result.status !== "open") throw new Error("expected open");
    expect(result.slots).not.toContainEqual(at("2026-10-13", "10:00"));
    expect(result.slots).not.toContainEqual(at("2026-10-13", "11:00"));
    expect(result.slots).toHaveLength(10);
  });

  it.each([
    ["a past date", "2026-10-11", "That date is in the past."],
    ["a closed day (Sunday)", "2026-10-18", "The business is closed that day."],
    ["more than 14 days ahead", "2026-10-27", "Bookings open up to 14 days ahead."],
  ])("is closed for %s", async (_label, date, reason) => {
    expect(await service.getSlots(TENANT, date, NOW)).toEqual({ status: "closed", timeZone: NY, reason });
  });

  it("allows booking exactly 14 days ahead", async () => {
    expect((await service.getSlots(TENANT, "2026-10-26", NOW)).status).toBe("open");
  });

  it("is closed when every slot is taken", async () => {
    const allDay = Array.from({ length: 12 }, (_, i) => ({
      startsAt: at("2026-10-13", `${String(7 + i).padStart(2, "0")}:00`),
    }));
    repo.bookedBetween.mockResolvedValue(allDay);

    expect(await service.getSlots(TENANT, "2026-10-13", NOW)).toEqual({
      status: "closed",
      timeZone: NY,
      reason: "No free times left that day.",
    });
  });

  it("is closed when the business hasn't set opening hours", async () => {
    repo.schedule.mockResolvedValue({ ...schedule, openingHours: null });

    expect(await service.getSlots(TENANT, "2026-10-13", NOW)).toEqual({
      status: "closed",
      timeZone: NY,
      reason: "Online booking is not set up.",
    });
  });

  it("only asks the database for this business's bookings", async () => {
    await service.getSlots(TENANT, "2026-10-13", NOW);
    expect(repo.bookedBetween).toHaveBeenCalledWith(TENANT, expect.any(Date), expect.any(Date));
  });
});
