import { Injectable, NotFoundException } from "@nestjs/common";
import type { ConversationRow, MessageRow } from "@frontpilot/db";
import { ConversationsRepository } from "./conversations.repository";
import type { ListConversationsQuery } from "./conversations.schemas";

// Anything waiting on the owner comes first; then most recent.
const statusPriority: Record<ConversationRow["status"], number> = {
  needs_owner: 0,
  open: 1,
  resolved_by_ai: 2,
  resolved_by_owner: 2,
};

function toSummary(row: ConversationRow, thread: MessageRow[]) {
  return {
    id: row.id,
    customerName: row.customerName,
    channel: row.channel,
    status: row.status,
    summary: row.summary ?? thread[0]?.content ?? null,
    lastMessage: thread.at(-1)?.content ?? null,
    messageCount: thread.length,
    updatedAt: row.updatedAt.toISOString(),
  };
}

@Injectable()
export class ConversationsService {
  constructor(private readonly repo: ConversationsRepository) {}

  async list(tenantId: string, filter: ListConversationsQuery) {
    const rows = await this.repo.findMany(tenantId, filter);
    const allMessages = await this.repo.messagesFor(rows.map((r) => r.id));
    const items = rows
      .map((row) => toSummary(row, allMessages.filter((m) => m.conversationId === row.id)))
      .sort((a, b) => statusPriority[a.status] - statusPriority[b.status]);
    return { items };
  }

  async get(tenantId: string, id: string) {
    const row = await this.repo.findOne(tenantId, id);
    if (!row) throw new NotFoundException("Conversation not found");
    const thread = await this.repo.messagesFor([row.id]);
    return {
      ...toSummary(row, thread),
      messages: thread.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  }
}
