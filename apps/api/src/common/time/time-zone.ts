// Small, dependency-free helpers for working in a business's own time zone.
// Dates are stored in UTC; "09:00 on 2026-10-05" only means something in a zone.

// How far ahead of UTC the zone is at that instant, in ms (negative for the Americas).
function offsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - instant.getTime();
}

// "2026-10-05" + "09:00" in America/New_York → the matching UTC instant (handles DST).
export function zonedTimeToUtc(date: string, time: string, timeZone: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y!, m! - 1, d!, hh!, mm!);
  const first = guess - offsetMs(new Date(guess), timeZone);
  // Recompute once in case the guess landed on the other side of a DST change.
  return new Date(guess - offsetMs(new Date(first), timeZone));
}

// The calendar date ("YYYY-MM-DD") of an instant, in the given zone.
export function dateInZone(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(instant);
}

// "Mon, Oct 5 at 9:00 AM"
export function formatInZone(instant: Date, timeZone: string): string {
  const day = instant.toLocaleDateString("en-US", { timeZone, weekday: "short", month: "short", day: "numeric" });
  const time = instant.toLocaleTimeString("en-US", { timeZone, hour: "numeric", minute: "2-digit" });
  return `${day} at ${time}`;
}

// Add whole days to a "YYYY-MM-DD" date string.
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
