import "server-only";
import { and, conversations, count, desc, eq, getDb, messages } from "@frontpilot/db";

export const MAX_MESSAGES_PER_CONVERSATION = 60;

export async function createConversation(tenantId: string): Promise<string> {
  const [row] = await getDb()
    .insert(conversations)
    .values({ tenantId, channel: "website_chat", status: "open" })
    .returning({ id: conversations.id });
  if (!row) throw new Error("Failed to create conversation");
  return row.id;
}

// Returns the conversation only if it belongs to this tenant.
// Never look up by id alone: an id from the browser could belong to another business.
export async function findConversation(conversationId: string, tenantId: string) {
  const [row] = await getDb()
    .select({ id: conversations.id })
    .from(conversations)
    .where(and(eq(conversations.id, conversationId), eq(conversations.tenantId, tenantId)))
    .limit(1);
  return row ?? null;
}

export async function countMessages(conversationId: string): Promise<number> {
  const [row] = await getDb()
    .select({ total: count() })
    .from(messages)
    .where(eq(messages.conversationId, conversationId));
  return row?.total ?? 0;
}

type NewMessage = {
  conversationId: string;
  tenantId: string;
  role: "user" | "assistant";
  content: string;
  inputTokens?: number;
  outputTokens?: number;
};

// Saves a message and bumps the conversation to the top of the dashboard list.
export async function appendMessage(message: NewMessage): Promise<void> {
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx.insert(messages).values(message);
    await tx
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, message.conversationId));
  });
}

// The most recent messages, oldest first, as the model expects them.
export async function getRecentMessages(conversationId: string, limit = 30) {
  const rows = await getDb()
    .select({ role: messages.role, content: messages.content })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(limit);
  return rows.reverse();
}

