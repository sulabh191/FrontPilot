import { Injectable } from "@nestjs/common";
import type { Tenant } from "../tenants/tenant.types";
import { AppointmentsRepository } from "./appointments.repository";
import type { ListAppointmentsQuery } from "./appointments.schemas";

@Injectable()
export class AppointmentsService {
  constructor(private readonly repo: AppointmentsRepository) {}

  async list(tenant: Tenant, filter: ListAppointmentsQuery) {
    const rows = await this.repo.findMany(tenant.id, filter);
    return {
      // Times are UTC; clients display them in the business's zone.
      timeZone: tenant.timeZone,
      items: rows.map((row) => ({
        id: row.id,
        customerName: row.customerName,
        service: row.service,
        address: row.address,
        startsAt: row.startsAt.toISOString(),
        status: row.status,
        bookedBy: row.bookedBy,
        leadId: row.leadId,
      })),
    };
  }
}
