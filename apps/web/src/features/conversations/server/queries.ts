import "server-only";
import { unwrap, type paths } from "@frontpilot/api-client";
import { getApi } from "@/shared/lib/api";
import { formatRelativeTime } from "@/shared/lib/format";
import type { Channel, Conversation, ConversationStatus } from "../types";

// One conversation summary exactly as the API returns it (generated types).
type ApiConversation =
  paths["/v1/conversations"]["get"]["responses"][200]["content"]["application/json"]["items"][number];

// API codes → the labels the UI shows.
const statusLabel: Record<ApiConversation["status"], ConversationStatus> = {
  needs_owner: "Needs you",
  open: "Open",
  resolved_by_ai: "Resolved by AI",
  resolved_by_owner: "Resolved by you",
};
const channelLabel: Record<ApiConversation["channel"], Channel> = {
  website_chat: "Website chat",
  email: "Email",
  sms: "SMS",
};

// The business's latest conversations. The API already puts anything
// needing the owner first, so this only turns API data into UI labels.
export async function getConversations(): Promise<Conversation[]> {
  const { items } = unwrap(await getApi().GET("/v1/conversations", { params: { query: { limit: 50 } } }));

  return items.map((c) => ({
    id: c.id,
    customer: c.customerName ?? "Website visitor",
    channel: channelLabel[c.channel],
    lastMessage: c.lastMessage ?? "",
    summary: c.summary ?? "New conversation",
    status: statusLabel[c.status],
    messageCount: c.messageCount,
    updatedAt: formatRelativeTime(new Date(c.updatedAt)),
  }));
}
