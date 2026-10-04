import type { Conversation, ConversationStatus } from "../types";
import { mockConversations } from "./mock-data";

const statusPriority: Record<ConversationStatus, number> = {
  "Needs you": 0,
  Open: 1,
  "Resolved by AI": 2,
};

// Conversations for one business, with anything needing the owner first.
export async function getConversations(tenantId: string): Promise<Conversation[]> {
  void tenantId;
  return [...mockConversations].sort(
    (a, b) => statusPriority[a.status] - statusPriority[b.status],
  );
}
