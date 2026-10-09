import { describe, expect, it } from "vitest";
import { addDays, dateInZone, formatInZone, zonedTimeToUtc } from "./time-zone";

// Times are stored in UTC and shown in the business's zone. These tests pin the
// conversions, including the two days a year when the clocks change.
describe("time-zone helpers", () => {
  describe("zonedTimeToUtc", () => {
    it("converts New York summer time (UTC-4)", () => {
      expect(zonedTimeToUtc("2026-10-12", "09:00", "America/New_York").toISOString()).toBe(
        "2026-10-12T13:00:00.000Z",
      );
    });

    it("converts New York winter time (UTC-5)", () => {
      expect(zonedTimeToUtc("2026-12-01", "09:00", "America/New_York").toISOString()).toBe(
        "2026-12-01T14:00:00.000Z",
      );
    });

    it("handles the spring-forward day (2026-03-08): before and after 2 AM", () => {
      expect(zonedTimeToUtc("2026-03-08", "01:30", "America/New_York").toISOString()).toBe(
        "2026-03-08T06:30:00.000Z", // still EST (UTC-5)
      );
      expect(zonedTimeToUtc("2026-03-08", "09:00", "America/New_York").toISOString()).toBe(
        "2026-03-08T13:00:00.000Z", // now EDT (UTC-4)
      );
    });

    it("handles the fall-back day (2026-11-01)", () => {
      expect(zonedTimeToUtc("2026-11-01", "09:00", "America/New_York").toISOString()).toBe(
        "2026-11-01T14:00:00.000Z", // back to EST (UTC-5)
      );
    });

    it("handles half-hour offsets (India, UTC+5:30)", () => {
      expect(zonedTimeToUtc("2026-10-12", "09:00", "Asia/Kolkata").toISOString()).toBe(
        "2026-10-12T03:30:00.000Z",
      );
    });
  });

  describe("dateInZone", () => {
    it("returns the local calendar date, which can differ from the UTC date", () => {
      const lateEvening = new Date("2026-10-13T02:00:00Z"); // 10 PM on the 12th in New York
      expect(dateInZone(lateEvening, "America/New_York")).toBe("2026-10-12");
      expect(dateInZone(lateEvening, "UTC")).toBe("2026-10-13");
    });
  });

  describe("formatInZone", () => {
    it("formats on the business's clock, whatever the server's zone", () => {
      // \s: newer Node versions put a narrow no-break space before "AM".
      expect(formatInZone(new Date("2026-10-12T13:00:00Z"), "America/New_York")).toMatch(
        /^Mon, Oct 12 at 9:00\sAM$/,
      );
    });
  });

  describe("addDays", () => {
    it("crosses month and year boundaries", () => {
      expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
      expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
      expect(addDays("2026-10-12", 14)).toBe("2026-10-26");
    });
  });
});
