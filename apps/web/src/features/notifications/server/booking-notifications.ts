import "server-only";
import { appointments, eq, getDb, leads, tenants } from "@frontpilot/db";
import { formatInZone } from "@/shared/lib/time-zone";
import { sendSms } from "./send-sms";
import { smsTemplates } from "./templates";

type BookingEvent = "confirmed" | "declined";

// Tells the customer about their booking, if they agreed to receive texts.
export async function notifyBookingUpdate(appointmentId: string, event: BookingEvent): Promise<void> {
  const [row] = await getDb()
    .select({
      customerName: appointments.customerName,
      service: appointments.service,
      startsAt: appointments.startsAt,
      phone: leads.phone,
      smsConsent: leads.smsConsent,
      businessName: tenants.name,
      timeZone: tenants.timeZone,
    })
    .from(appointments)
    .innerJoin(leads, eq(appointments.leadId, leads.id))
    .innerJoin(tenants, eq(appointments.tenantId, tenants.id))
    .where(eq(appointments.id, appointmentId))
    .limit(1);

  if (!row?.phone) return;
  if (!row.smsConsent) {
    console.info(`[sms] skipped: customer did not agree to texts (appointment ${appointmentId})`);
    return;
  }

  const info = {
    businessName: row.businessName,
    customerName: row.customerName,
    service: row.service,
    when: formatInZone(row.startsAt, row.timeZone),
  };
  const body = event === "confirmed" ? smsTemplates.bookingConfirmed(info) : smsTemplates.bookingDeclined(info);
  await sendSms(row.phone, body);
}
