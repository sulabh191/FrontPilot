import { z } from "zod";

// What the widget sends: only the new message. History is loaded from the database,
// so a browser can never inject fake earlier messages.
export const chatRequestSchema = z.object({
  tenantSlug: z.string().min(1).max(64),
  conversationId: z.uuid().optional(),
  message: z.string().trim().min(1).max(1000),
});
export type ChatRequest = z.infer<typeof chatRequestSchema>;

// The response is a stream of these events, one JSON object per line (NDJSON).
export const chatEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("conversation"), conversationId: z.uuid() }),
  z.object({ type: z.literal("text"), text: z.string() }),
  z.object({ type: z.literal("suggestions"), options: z.array(z.string()) }),
  z.object({ type: z.literal("error"), message: z.string() }),
]);
export type ChatEvent = z.infer<typeof chatEventSchema>;

export const widgetSlugParamSchema = z.string().regex(/^[a-z0-9-]{1,64}$/, "Invalid business slug");

// Public, safe-to-expose widget settings. Never the private instructions.
export const widgetConfigSchema = z.object({
  tenantSlug: z.string(),
  businessName: z.string(),
  agentName: z.string(),
  greeting: z.string(),
  suggestedQuestions: z.array(z.string()),
});
