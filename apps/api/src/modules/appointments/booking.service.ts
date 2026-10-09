import { Inject, Injectable } from "@nestjs/common";
import { and, APPOINTMENT_SLOT_UNIQUE, appointments, conversations, eq, leads, type Database } from "@frontpilot/db";
import { zonedTimeToUtc } from "../../common/time/time-zone";
import { DATABASE } from "../../database/database.constants";
import { AvailabilityService } from "../availability/availability.service";
import { NotificationsService } from "../notifications/notifications.service";

export type BookingRequest = {
  tenantId: string;
  conversationId: string;
  customerName: string;
  phone: string;
  service: string;
  date: string; // "YYYY-MM-DD", business time zone
  time: string; // "HH:MM" 24-hour, business time zone
  address: string;
  smsConsent: boolean;
  requireApproval: boolean; // review mode → owner must approve
};

// True when Postgres refused an insert because the slot already has a live booking
// (unique violation 23505 on our index). Drizzle wraps driver errors, so check the cause too.
function isSlotTaken(error: unknown): boolean {
  const outer = error as { code?: string; constraint_name?: string; cause?: unknown } | null;
  const pg = (outer?.cause ?? outer) as { code?: string; constraint_name?: string } | null;
  return pg?.code === "23505" && pg.constraint_name === APPOINTMENT_SLOT_UNIQUE;
}

export type BookingResult =
  | { ok: true; appointmentId: string; startsAt: Date; status: "confirmed" | "awaiting_approval" }
  | { ok: false; reason: string };

// Creates a lead + appointment, after re-checking the slot.
// The model never writes to the database: it asks, and this code decides.
@Injectable()
export class BookingService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly availability: AvailabilityService,
    private readonly notifications: NotificationsService,
  ) {}

  async book(req: BookingRequest): Promise<BookingResult> {
    const check = await this.availability.getSlots(req.tenantId, req.date);
    const startsAt = zonedTimeToUtc(req.date, req.time, check.timeZone);

    // 1. Idempotency: the same conversation asking for the same slot again returns the existing booking.
    const [existing] = await this.db
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

    // 2. The slot must still be free.
    const isFree = check.status === "open" && check.slots.some((slot) => slot.getTime() === startsAt.getTime());
    if (!isFree) return { ok: false, reason: "That time is not available. Check availability again." };

    // 3. Lead + appointment + conversation update together, or nothing.
    const status = req.requireApproval ? "awaiting_approval" : "confirmed";
    let appointmentId: string;
    try {
      appointmentId = await this.db.transaction(async (tx) => {
        const [lead] = await tx
          .insert(leads)
          .values({
            tenantId: req.tenantId,
            conversationId: req.conversationId,
            name: req.customerName,
            phone: req.phone,
            smsConsent: req.smsConsent,
            service: req.service,
            score: "hot",
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
            status: req.requireApproval ? "needs_owner" : "resolved_by_ai",
            summary: `${req.service}; booking ${req.requireApproval ? "awaiting approval" : "confirmed"}`,
            updatedAt: new Date(),
          })
          .where(and(eq(conversations.id, req.conversationId), eq(conversations.tenantId, req.tenantId)));

        return appointment!.id;
      });
    } catch (error) {
      // Another chat booked this exact slot between our availability check and our insert.
      // The whole transaction (lead included) was rolled back; nothing was written.
      if (isSlotTaken(error)) return { ok: false, reason: "That time was just taken. Check availability again." };
      throw error;
    }

    // Auto mode: final now, so tell the customer (never fails the booking).
    if (status === "confirmed") await this.notifications.notifyBookingUpdate(appointmentId, "confirmed");

    return { ok: true, appointmentId, startsAt, status };
  }
}
