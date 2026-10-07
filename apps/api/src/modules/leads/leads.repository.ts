import { Inject, Injectable } from "@nestjs/common";
import { and, desc, eq, leads, type Database } from "@frontpilot/db";
import { DATABASE } from "../../database/database.constants";
import type { ListLeadsQuery } from "./leads.schemas";

// Data access only: SQL lives here, nothing else does.
@Injectable()
export class LeadsRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  findAll(tenantId: string, filter: ListLeadsQuery) {
    return this.db
      .select()
      .from(leads)
      .where(and(eq(leads.tenantId, tenantId), filter.stage ? eq(leads.stage, filter.stage) : undefined))
      .orderBy(desc(leads.createdAt));
  }
}
