import type { Conversation } from "../types";

export const mockConversations: Conversation[] = [
  { id: "c1", customer: "Priya Shah", channel: "Website chat", lastMessage: "Under the sink. 2:30 works for me.", summary: "Leaking kitchen sink; booking for Mon 2:30 PM awaits approval", status: "Needs you", messageCount: 6, updatedAt: "10 min ago" },
  { id: "c2", customer: "Website visitor", channel: "Website chat", lastMessage: "Do you work weekends?", summary: "Asked about weekend hours; answered from FAQ", status: "Resolved by AI", messageCount: 2, updatedAt: "32 min ago" },
  { id: "c3", customer: "Mark Chen", channel: "Website chat", lastMessage: "Can you give me a quote for a tankless water heater?", summary: "Wants a custom quote; outside the price list", status: "Needs you", messageCount: 4, updatedAt: "1 hr ago" },
  { id: "c4", customer: "Nina Brooks", channel: "Email", lastMessage: "Thanks, I'll check the valve first.", summary: "Low water pressure; sent troubleshooting steps", status: "Open", messageCount: 3, updatedAt: "2 hrs ago" },
  { id: "c5", customer: "Alex Kim", channel: "Website chat", lastMessage: "Thanks, see you Monday!", summary: "Burst pipe; booked Mon 9:00 AM", status: "Resolved by AI", messageCount: 8, updatedAt: "Yesterday" },
  { id: "c6", customer: "Jordan Lee", channel: "SMS", lastMessage: "Yes, 11 works.", summary: "Toilet repair; confirmed via SMS reminder", status: "Resolved by AI", messageCount: 3, updatedAt: "Yesterday" },
];
