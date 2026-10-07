import { Inject, Injectable, Logger } from "@nestjs/common";
import { appointments, eq, leads, tenants, type Database } from "@frontpilot/db";
import { formatInZone } from "../../common/time/time-zone";
import { DATABASE } from "../../database/database.constants";
import { toE164 } from "./phone";
import { SMS_PROVIDER, type SmsProvider } from "./sms-provider";
import { smsTemplates } from "./sms-templates";

export type BookingEvent = "confirmed" | "declined";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @Inject(DATABASE) private readonly db: Database,
    @Inject(SMS_PROVIDER) private readonly sms: SmsProvider, // console or Twilio: this class doesn't care
  ) {}

  // Tells the customer about their booking, if they agreed to texts.
  // Never throws: a failed notification must not undo the booking or approval.
  async notifyBookingUpdate(appointmentId: string, event: BookingEvent): Promise<void> {
    try {
      const [row] = await this.db
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
        this.logger.log(`SMS skipped (no consent) for appointment ${appointmentId}`);
        return;
      }

      const to = toE164(row.phone);
      if (!to) {
        this.logger.warn(`SMS skipped (invalid phone "${row.phone}") for appointment ${appointmentId}`);
        return;
      }

      const info = {
        businessName: row.businessName,
        customerName: row.customerName,
        service: row.service,
        when: formatInZone(row.startsAt, row.timeZone),
      };
      const body = event === "confirmed" ? smsTemplates.bookingConfirmed(info) : smsTemplates.bookingDeclined(info);

      const result = await this.sms.send({ to, body });
      if (!result.ok) this.logger.error(`SMS via ${this.sms.name} failed: ${result.error}`);
    } catch (error) {
      this.logger.error(`Notification failed for appointment ${appointmentId}`, error as Error);
    }
  }
}
