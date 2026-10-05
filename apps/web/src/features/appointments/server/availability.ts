import "server-only";
import {
  and,
  appointments,
  eq,
  getDb,
  gte,
  lt,
  ne,
  tenants,
  type Weekday,
} from "@frontpilot/db";
import { addDays, dateInZone, zonedTimeToUtc } from "@/shared/lib/time-zone";

const WEEKDAYS: Weekday[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const MAX_DAYS_AHEAD = 14;
const MIN_NOTICE_MINUTES = 60; // no bookings starting within the next hour

export type AvailabilityResult =
  | { status: "open"; slots: Date[] }
  | { status: "closed"; reason: string };

// Free appointment slots on one day, computed by code from real data:
// opening hours, minus past times, minus existing bookings.
export async function getAvailableSlots(
  tenantId: string,
  date: string, // "YYYY-MM-DD" in the business's time zone
  now = new Date(),
): Promise<AvailabilityResult> {
  const db = getDb();
  const [tenant] = await db
    .select({
      timeZone: tenants.timeZone,
      openingHours: tenants.openingHours,
      appointmentMinutes: tenants.appointmentMinutes,
    })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);
  if (!tenant?.openingHours) return { status: "closed", reason: "Online booking is not set up." };

  const today = dateInZone(now, tenant.timeZone);
  if (date < today) return { status: "closed", reason: "That date is in the past." };
  if (date > addDays(today, MAX_DAYS_AHEAD)) {
    return { status: "closed", reason: `Bookings open up to ${MAX_DAYS_AHEAD} days ahead.` };
  }

  const weekday = WEEKDAYS[new Date(`${date}T12:00:00Z`).getUTCDay()]!;
  const hours = tenant.openingHours[weekday];
  if (!hours) return { status: "closed", reason: "The business is closed that day." };

  // Candidate start times every appointment-length, from opening until the last fitting slot.
  const length = tenant.appointmentMinutes;
  const opens = zonedTimeToUtc(date, hours.open, tenant.timeZone);
  const closes = zonedTimeToUtc(date, hours.close, tenant.timeZone);
  const earliest = new Date(now.getTime() + MIN_NOTICE_MINUTES * 60_000);
  const candidates: Date[] = [];
  for (let t = opens.getTime(); t + length * 60_000 <= closes.getTime(); t += length * 60_000) {
    if (t >= earliest.getTime()) candidates.push(new Date(t));
  }

  // Remove slots that overlap an existing (non-cancelled) appointment.
  const booked = await db
    .select({ startsAt: appointments.startsAt })
    .from(appointments)
    .where(
      and(
        eq(appointments.tenantId, tenantId),
        ne(appointments.status, "cancelled"),
        gte(appointments.startsAt, new Date(opens.getTime() - length * 60_000)),
        lt(appointments.startsAt, closes),
      ),
    );
  const slots = candidates.filter((slot) =>
    booked.every((b) => Math.abs(b.startsAt.getTime() - slot.getTime()) >= length * 60_000),
  );

  return slots.length
    ? { status: "open", slots }
    : { status: "closed", reason: "No free times left that day." };
}

export async function getTenantTimeZone(tenantId: string): Promise<string> {
  const [row] = await getDb()
    .select({ timeZone: tenants.timeZone })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);
  return row?.timeZone ?? "America/New_York";
}
