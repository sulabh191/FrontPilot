import { Inject, Injectable } from "@nestjs/common";
import { and, asc, conversations, desc, eq, inArray, messages, type Database } from "@frontpilot/db";
import { DATABASE } from "../../database/database.constants";
import type { ListConversationsQuery } from "./conversations.schemas";

@Injectable()
export class ConversationsRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  findMany(tenantId: string, filter: ListConversationsQuery) {
    return this.db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.tenantId, tenantId),
          filter.status ? eq(conversations.status, filter.status) : undefined,
        ),
      )
      .orderBy(desc(conversations.updatedAt))
      .limit(filter.limit);
  }

  // Tenant-scoped: an id from another business returns nothing.
  async findOne(tenantId: string, id: string) {
    const [row] = await this.db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.tenantId, tenantId)))
      .limit(1);
    return row ?? null;
  }

  // All messages for many conversations in ONE query (avoids the N+1 problem).
  messagesFor(conversationIds: string[]) {
    if (conversationIds.length === 0) return Promise.resolve([]);
    return this.db
      .select()
      .from(messages)
      .where(inArray(messages.conversationId, conversationIds))
      .orderBy(asc(messages.createdAt));
  }
}
