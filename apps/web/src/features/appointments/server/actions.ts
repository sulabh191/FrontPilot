"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { and, appointments, conversations, eq, getDb, leads } from "@frontpilot/db";
import { getCurrentTenant } from "@/shared/lib/tenant";

export type ApprovalResult = { ok: boolean; message: string };

const idSchema = z.uuid();

// Shared by approve and decline. Only touches an appointment that
// (1) belongs to the signed-in business and (2) is still awaiting approval.
async function decide(appointmentId: string, decision: "approve" | "decline"): Promise<ApprovalResult> {
  const parsed = idSchema.safeParse(appointmentId);
  if (!parsed.success) return { ok: false, message: "Invalid appointment." };

  const tenant = await getCurrentTenant(); // from the session, never from the browser
  const db = getDb();

  const result = await db.transaction(async (tx) => {
    // The status condition makes this safe to click twice: the second click changes nothing.
    const [updated] = await tx
      .update(appointments)
      .set({ status: decision === "approve" ? "confirmed" : "cancelled" })
      .where(
        and(
          eq(appointments.id, parsed.data),
          eq(appointments.tenantId, tenant.id),
          eq(appointments.status, "awaiting_approval"),
        ),
      )
      .returning({ leadId: appointments.leadId, service: appointments.service });
    if (!updated) return null;

    if (updated.leadId) {
      // Declined: the lead still needs a time, so it goes back to Qualified.
      const [lead] = await tx
        .update(leads)
        .set({ stage: decision === "approve" ? "booked" : "qualified", updatedAt: new Date() })
        .where(and(eq(leads.id, updated.leadId), eq(leads.tenantId, tenant.id)))
        .returning({ conversationId: leads.conversationId });

      if (lead?.conversationId) {
        await tx
          .update(conversations)
          .set(
            decision === "approve"
              ? { status: "resolved_by_owner", summary: `${updated.service}; booking confirmed by owner`, updatedAt: new Date() }
              : { status: "needs_owner", summary: `${updated.service}; booking declined, follow up with customer`, updatedAt: new Date() },
          )
          .where(and(eq(conversations.id, lead.conversationId), eq(conversations.tenantId, tenant.id)));
      }
    }
    return updated;
  });

  if (!result) return { ok: false, message: "This booking was already handled." };

  // Every dashboard page shows appointment data, so refresh them all.
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: decision === "approve" ? "Booking confirmed." : "Booking declined." };
}

export async function approveAppointment(appointmentId: string): Promise<ApprovalResult> {
  return decide(appointmentId, "approve");
}

export async function declineAppointment(appointmentId: string): Promise<ApprovalResult> {
  return decide(appointmentId, "decline");
}
