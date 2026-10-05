import "server-only";
import { and, appointments, conversations, eq, getDb, leads } from "@frontpilot/db";
import { zonedTimeToUtc } from "@/shared/lib/time-zone";
import { getAvailableSlots, getTenantTimeZone } from "./availability";

export type BookingRequest = {
  tenantId: string;
  conversationId: string;
  customerName: string;
  phone: string;
  service: string;
  date: string; // "YYYY-MM-DD", business time zone
  time: string; // "HH:MM" 24-hour, business time zone
  address: string;
  requireApproval: boolean; // review mode → owner must approve
};

export type BookingResult =
  | { ok: true; appointmentId: string; startsAt: Date; status: "confirmed" | "awaiting_approval" }
  | { ok: false; reason: string };

// Creates a lead + appointment for a customer, after re-checking the slot.
// The model never writes to the database directly: it asks, and this code decides.
export async function bookAppointment(req: BookingRequest): Promise<BookingResult> {
  const timeZone = await getTenantTimeZone(req.tenantId);
  const startsAt = zonedTimeToUtc(req.date, req.time, timeZone);

  // 1. Idempotency: the same conversation asking for the same slot again
  //    (a retry, or the model calling twice) returns the existing booking.
  const db = getDb();
  const [existing] = await db
    .select({ id: appointments.id, status: appointments.status })
    .from(appointments)
    .innerJoin(leads, eq(appointments.leadId, leads.id))
    .where(
      and(
        eq(appointments.tenantId, req.tenantId),
        eq(leads.conversationId, req.conversationId),
        eq(appointments.startsAt, startsAt),
      ),
    )
    .limit(1);
  if (existing && existing.status !== "cancelled") {
    return { ok: true, appointmentId: existing.id, startsAt, status: existing.status };
  }

  // 2. The slot must still be free (someone else may have taken it meanwhile).
  const availability = await getAvailableSlots(req.tenantId, req.date);
  const isFree =
    availability.status === "open" &&
    availability.slots.some((slot) => slot.getTime() === startsAt.getTime());
  if (!isFree) {
    return { ok: false, reason: "That time is not available. Check availability again." };
  }

  // 3. Save lead + appointment + conversation update together, or nothing at all.
  const status = req.requireApproval ? "awaiting_approval" : "confirmed";
  const appointmentId = await db.transaction(async (tx) => {
    const [lead] = await tx
      .insert(leads)
      .values({
        tenantId: req.tenantId,
        conversationId: req.conversationId,
        name: req.customerName,
        phone: req.phone,
        service: req.service,
        score: "hot", // asked for a visit: highest intent
        stage: "booked",
        source: "website_chat",
      })
      .returning({ id: leads.id });

    const [appointment] = await tx
      .insert(appointments)
      .values({
        tenantId: req.tenantId,
        leadId: lead!.id,
        customerName: req.customerName,
        service: req.service,
        address: req.address,
        startsAt,
        status,
        bookedBy: "ai_agent",
      })
      .returning({ id: appointments.id });

    await tx
      .update(conversations)
      .set({
        customerName: req.customerName,
        // Review mode: the owner has something to approve.
        status: req.requireApproval ? "needs_owner" : "resolved_by_ai",
        summary: `${req.service}; booking ${req.requireApproval ? "awaiting approval" : "confirmed"}`,
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, req.conversationId));

    return appointment!.id;
  });

  return { ok: true, appointmentId, startsAt, status };
}
