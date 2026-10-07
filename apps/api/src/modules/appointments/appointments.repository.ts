import { Inject, Injectable } from "@nestjs/common";
import { and, appointments, asc, eq, gte, type Database } from "@frontpilot/db";
import { DATABASE } from "../../database/database.constants";
import type { ListAppointmentsQuery } from "./appointments.schemas";

@Injectable()
export class AppointmentsRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  findMany(tenantId: string, filter: ListAppointmentsQuery) {
    return this.db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.tenantId, tenantId),
          filter.status ? eq(appointments.status, filter.status) : undefined,
          filter.from ? gte(appointments.startsAt, new Date(filter.from)) : undefined,
        ),
      )
      .orderBy(asc(appointments.startsAt));
  }
}
