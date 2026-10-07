import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { and, appointments, conversations, eq, leads, type Database } from "@frontpilot/db";
import { DATABASE } from "../../database/database.constants";
import { NotificationsService } from "../notifications/notifications.service";

type Decision = "approve" | "decline";

// The owner's decision on a booking the agent made in review mode.
@Injectable()
export class AppointmentApprovalsService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly notifications: NotificationsService,
  ) {}

  approve(tenantId: string, appointmentId: string) {
    return this.decide(tenantId, appointmentId, "approve");
  }

  decline(tenantId: string, appointmentId: string) {
    return this.decide(tenantId, appointmentId, "decline");
  }

  private async decide(tenantId: string, appointmentId: string, decision: Decision) {
    const newStatus = decision === "approve" ? "confirmed" : "cancelled";

    await this.db.transaction(async (tx) => {
      // 1. Must exist for THIS business (404), and still be pending (409).
      const [current] = await tx
        .select({ status: appointments.status })
        .from(appointments)
        .where(and(eq(appointments.id, appointmentId), eq(appointments.tenantId, tenantId)))
        .limit(1);
      if (!current) throw new NotFoundException("Appointment not found");
      if (current.status !== "awaiting_approval") {
        throw new ConflictException(`This booking was already handled (status: ${current.status})`);
      }

      // 2. Conditional update: if someone else decided in the meantime, nothing matches → 409.
      const [updated] = await tx
        .update(appointments)
        .set({ status: newStatus })
        .where(
          and(
            eq(appointments.id, appointmentId),
            eq(appointments.tenantId, tenantId),
            eq(appointments.status, "awaiting_approval"),
          ),
        )
        .returning({ leadId: appointments.leadId, service: appointments.service });
      if (!updated) throw new ConflictException("This booking was just handled by someone else");

      // 3. Keep the lead and the conversation consistent with the decision.
      if (!updated.leadId) return;
      const [lead] = await tx
        .update(leads)
        .set({ stage: decision === "approve" ? "booked" : "qualified", updatedAt: new Date() })
        .where(and(eq(leads.id, updated.leadId), eq(leads.tenantId, tenantId)))
        .returning({ conversationId: leads.conversationId });

      if (lead?.conversationId) {
        await tx
          .update(conversations)
          .set(
            decision === "approve"
              ? { status: "resolved_by_owner", summary: `${updated.service}; booking confirmed by owner`, updatedAt: new Date() }
              : { status: "needs_owner", summary: `${updated.service}; booking declined, follow up with customer`, updatedAt: new Date() },
          )
          .where(and(eq(conversations.id, lead.conversationId), eq(conversations.tenantId, tenantId)));
      }
    });

    // 4. After the commit: tell the customer. Never fails the request.
    await this.notifications.notifyBookingUpdate(appointmentId, decision === "approve" ? "confirmed" : "declined");

    return { id: appointmentId, status: newStatus };
  }
}
