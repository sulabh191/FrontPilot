import { Inject, Injectable } from "@nestjs/common";
import {
  and,
  appointments,
  asc,
  conversations,
  count,
  desc,
  eq,
  gte,
  inArray,
  leads,
  messages,
  ne,
  type Database,
} from "@frontpilot/db";
import { DATABASE } from "../../database/database.constants";

@Injectable()
export class OverviewRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  conversationCountsByStatus(tenantId: string, since: Date) {
    return this.db
      .select({ status: conversations.status, total: count() })
      .from(conversations)
      .where(and(eq(conversations.tenantId, tenantId), gte(conversations.createdAt, since)))
      .groupBy(conversations.status);
  }

  async newLeadCount(tenantId: string, since: Date) {
    const [row] = await this.db
      .select({ total: count() })
      .from(leads)
      .where(and(eq(leads.tenantId, tenantId), gte(leads.createdAt, since)));
    return row?.total ?? 0;
  }

  async bookedCount(tenantId: string, since: Date) {
    const [row] = await this.db
      .select({ total: count() })
      .from(appointments)
      .where(
        and(
          eq(appointments.tenantId, tenantId),
          gte(appointments.createdAt, since),
          ne(appointments.status, "cancelled"),
        ),
      );
    return row?.total ?? 0;
  }

  needsOwner(tenantId: string, limit: number) {
    return this.db
      .select()
      .from(conversations)
      .where(and(eq(conversations.tenantId, tenantId), eq(conversations.status, "needs_owner")))
      .orderBy(desc(conversations.updatedAt))
      .limit(limit);
  }

  // Customer messages for several conversations in one query.
  customerMessages(conversationIds: string[]) {
    if (conversationIds.length === 0) return Promise.resolve([]);
    return this.db
      .select({ conversationId: messages.conversationId, content: messages.content })
      .from(messages)
      .where(and(inArray(messages.conversationId, conversationIds), eq(messages.role, "user")))
      .orderBy(asc(messages.createdAt));
  }

  upcoming(tenantId: string, from: Date, limit: number) {
    return this.db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.tenantId, tenantId),
          gte(appointments.startsAt, from),
          ne(appointments.status, "cancelled"),
        ),
      )
      .orderBy(asc(appointments.startsAt))
      .limit(limit);
  }
}
