export type ConversationStatus = "Needs you" | "Open" | "Resolved by AI" | "Resolved by you";
export type Channel = "Website chat" | "Email" | "SMS";

export type Conversation = {
  id: string;
  customer: string;
  channel: Channel;
  lastMessage: string;
  summary: string;
  status: ConversationStatus;
  messageCount: number;
  updatedAt: string;
};
