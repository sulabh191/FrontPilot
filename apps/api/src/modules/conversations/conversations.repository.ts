import { Inject, Injectable } from "@nestjs/common";
import { and, asc, conversations, count, desc, eq, inArray, messages, type Database } from "@frontpilot/db";
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

  // ---------- write side (used by the public chat) ----------

  async create(tenantId: string): Promise<string> {
    const [row] = await this.db
      .insert(conversations)
      .values({ tenantId, channel: "website_chat", status: "open" })
      .returning({ id: conversations.id });
    return row!.id;
  }

  async countMessages(conversationId: string): Promise<number> {
    const [row] = await this.db
      .select({ total: count() })
      .from(messages)
      .where(eq(messages.conversationId, conversationId));
    return row?.total ?? 0;
  }

  // Saves a message and moves the conversation to the top of the dashboard list.
  async appendMessage(message: {
    conversationId: string;
    tenantId: string;
    role: "user" | "assistant";
    content: string;
    inputTokens?: number;
    outputTokens?: number;
  }): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.insert(messages).values(message);
      await tx
        .update(conversations)
        .set({ updatedAt: new Date() })
        .where(and(eq(conversations.id, message.conversationId), eq(conversations.tenantId, message.tenantId)));
    });
  }

  // The most recent messages, oldest first, as the model expects them.
  async recentMessages(conversationId: string, limit = 30) {
    const rows = await this.db
      .select({ role: messages.role, content: messages.content })
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);
    return rows.reverse();
  }
}
