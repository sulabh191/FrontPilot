import { z } from "zod";

export const leadStages = ["new", "qualified", "booked", "won", "lost"] as const;

// GET /v1/leads?stage=booked
export const listLeadsQuerySchema = z.object({
  stage: z.enum(leadStages).optional(),
});
export type ListLeadsQuery = z.infer<typeof listLeadsQuerySchema>;

// Response shape (documents the API and generates client types).
export const leadSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  phone: z.string().nullable(),
  smsConsent: z.boolean(),
  service: z.string(),
  score: z.enum(["hot", "warm", "cold"]),
  stage: z.enum(leadStages),
  estimatedValue: z.number().int().nullable().describe("Whole dollars"),
  source: z.enum(["website_chat", "email", "sms"]),
  conversationId: z.uuid().nullable(),
  createdAt: z.iso.datetime(),
});
export const leadListSchema = z.object({ items: z.array(leadSchema) });
