import { z } from "zod";

export const conversationStatuses = ["open", "needs_owner", "resolved_by_ai", "resolved_by_owner"] as const;

export const listConversationsQuerySchema = z.object({
  status: z.enum(conversationStatuses).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type ListConversationsQuery = z.infer<typeof listConversationsQuerySchema>;

export const conversationIdParamSchema = z.uuid();

const conversationSummary = z.object({
  id: z.uuid(),
  customerName: z.string().nullable(),
  channel: z.enum(["website_chat", "email", "sms"]),
  status: z.enum(conversationStatuses),
  summary: z.string().nullable(),
  lastMessage: z.string().nullable(),
  messageCount: z.number().int(),
  updatedAt: z.iso.datetime(),
});
export const conversationListSchema = z.object({ items: z.array(conversationSummary) });

export const conversationDetailSchema = conversationSummary.extend({
  messages: z.array(
    z.object({
      id: z.uuid(),
      role: z.enum(["user", "assistant"]),
      content: z.string(),
      createdAt: z.iso.datetime(),
    }),
  ),
});
