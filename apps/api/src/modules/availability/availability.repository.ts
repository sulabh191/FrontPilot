import { Inject, Injectable } from "@nestjs/common";
import { and, appointments, eq, gte, lt, ne, tenants, type Database } from "@frontpilot/db";
import { DATABASE } from "../../database/database.constants";

@Injectable()
export class AvailabilityRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async schedule(tenantId: string) {
    const [row] = await this.db
      .select({
        timeZone: tenants.timeZone,
        openingHours: tenants.openingHours,
        appointmentMinutes: tenants.appointmentMinutes,
      })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);
    return row ?? null;
  }

  bookedBetween(tenantId: string, from: Date, to: Date) {
    return this.db
      .select({ startsAt: appointments.startsAt })
      .from(appointments)
      .where(
        and(
          eq(appointments.tenantId, tenantId),
          ne(appointments.status, "cancelled"),
          gte(appointments.startsAt, from),
          lt(appointments.startsAt, to),
        ),
      );
  }
}
