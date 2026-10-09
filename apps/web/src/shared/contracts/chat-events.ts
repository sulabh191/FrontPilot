import { z } from "zod";

// The chat API (POST /v1/chat) streams newline-delimited JSON (NDJSON): one event per line.
// The widget validates every line against this schema; the API writes the same shapes.
export const chatEventSchema = z.discriminatedUnion("type", [
  // Sent first: the id the widget must send back with its next message.
  z.object({ type: z.literal("conversation"), conversationId: z.string() }),
  z.object({ type: z.literal("text"), text: z.string() }),
  z.object({ type: z.literal("suggestions"), options: z.array(z.string()).max(3) }),
  z.object({ type: z.literal("error"), message: z.string() }),
]);

export type ChatEvent = z.infer<typeof chatEventSchema>;


// What the widget sends: only the new message. The API loads the history itself.
export const chatRequestSchema = z.object({
  tenantSlug: z.string().min(1).max(64),
  conversationId: z.uuid().optional(),
  message: z.string().trim().min(1).max(1000),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
