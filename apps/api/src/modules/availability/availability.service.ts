import { Injectable } from "@nestjs/common";
import type { Weekday } from "@frontpilot/db";
import { addDays, dateInZone, zonedTimeToUtc } from "../../common/time/time-zone";
import { AvailabilityRepository } from "./availability.repository";

const WEEKDAYS: Weekday[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const MAX_DAYS_AHEAD = 14;
const MIN_NOTICE_MINUTES = 60;

export type AvailabilityResult =
  | { status: "open"; timeZone: string; slots: Date[] }
  | { status: "closed"; timeZone: string; reason: string };

// Free slots for one day, computed by code from real data:
// opening hours − past/too-soon times − existing bookings.
// Used by the owner endpoint now and by the agent's tool in phase E.
@Injectable()
export class AvailabilityService {
  constructor(private readonly repo: AvailabilityRepository) {}

  async getSlots(tenantId: string, date: string, now = new Date()): Promise<AvailabilityResult> {
    const schedule = await this.repo.schedule(tenantId);
    const timeZone = schedule?.timeZone ?? "America/New_York";
    if (!schedule?.openingHours) return { status: "closed", timeZone, reason: "Online booking is not set up." };

    const today = dateInZone(now, timeZone);
    if (date < today) return { status: "closed", timeZone, reason: "That date is in the past." };
    if (date > addDays(today, MAX_DAYS_AHEAD)) {
      return { status: "closed", timeZone, reason: `Bookings open up to ${MAX_DAYS_AHEAD} days ahead.` };
    }

    const hours = schedule.openingHours[WEEKDAYS[new Date(`${date}T12:00:00Z`).getUTCDay()]!];
    if (!hours) return { status: "closed", timeZone, reason: "The business is closed that day." };

    const lengthMs = schedule.appointmentMinutes * 60_000;
    const opens = zonedTimeToUtc(date, hours.open, timeZone);
    const closes = zonedTimeToUtc(date, hours.close, timeZone);
    const earliest = now.getTime() + MIN_NOTICE_MINUTES * 60_000;

    const candidates: Date[] = [];
    for (let t = opens.getTime(); t + lengthMs <= closes.getTime(); t += lengthMs) {
      if (t >= earliest) candidates.push(new Date(t));
    }

    const booked = await this.repo.bookedBetween(tenantId, new Date(opens.getTime() - lengthMs), closes);
    const slots = candidates.filter((slot) =>
      booked.every((b) => Math.abs(b.startsAt.getTime() - slot.getTime()) >= lengthMs),
    );

    return slots.length
      ? { status: "open", timeZone, slots }
      : { status: "closed", timeZone, reason: "No free times left that day." };
  }
}
