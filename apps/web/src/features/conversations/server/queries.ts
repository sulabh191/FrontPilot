import "server-only";
import {
  asc,
  conversations,
  desc,
  eq,
  getDb,
  inArray,
  messages,
  type ConversationRow,
} from "@frontpilot/db";
import { formatRelativeTime } from "@/shared/lib/format";
import type { Channel, Conversation, ConversationStatus } from "../types";

const statusLabel: Record<ConversationRow["status"], ConversationStatus> = {
  needs_owner: "Needs you",
  open: "Open",
  resolved_by_ai: "Resolved by AI",
  resolved_by_owner: "Resolved by you",
};
const channelLabel: Record<ConversationRow["channel"], Channel> = {
  website_chat: "Website chat",
  email: "Email",
  sms: "SMS",
};
const statusPriority: Record<ConversationStatus, number> = {
  "Needs you": 0,
  Open: 1,
  "Resolved by AI": 2,
  "Resolved by you": 2,
};

// A tenant's latest conversations, with anything needing the owner first.
export async function getConversations(tenantId: string): Promise<Conversation[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(conversations)
    .where(eq(conversations.tenantId, tenantId))
    .orderBy(desc(conversations.updatedAt))
    .limit(50);
  if (rows.length === 0) return [];

  // One query for all their messages, instead of one query per conversation.
  const allMessages = await db
    .select({
      conversationId: messages.conversationId,
      content: messages.content,
    })
    .from(messages)
    .where(inArray(messages.conversationId, rows.map((r) => r.id)))
    .orderBy(asc(messages.createdAt));

  return rows
    .map((row) => {
      const thread = allMessages.filter((m) => m.conversationId === row.id);
      return {
        id: row.id,
        customer: row.customerName ?? "Website visitor",
        channel: channelLabel[row.channel],
        lastMessage: thread.at(-1)?.content ?? "",
        summary: row.summary ?? thread[0]?.content ?? "New conversation",
        status: statusLabel[row.status],
        messageCount: thread.length,
        updatedAt: formatRelativeTime(row.updatedAt),
      };
    })
    .sort((a, b) => statusPriority[a.status] - statusPriority[b.status]);
}
