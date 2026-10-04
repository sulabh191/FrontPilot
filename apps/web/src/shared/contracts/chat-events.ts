import { z } from "zod";

// The chat API streams newline-delimited JSON (NDJSON): one event per line.
// Shared by the server (which writes events) and the widget (which reads them),
// so both sides always agree on the format.
export const chatEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), text: z.string() }),
  z.object({ type: z.literal("suggestions"), options: z.array(z.string()).max(3) }),
  z.object({ type: z.literal("error"), message: z.string() }),
]);

export type ChatEvent = z.infer<typeof chatEventSchema>;

export function encodeChatEvent(event: ChatEvent): string {
  return JSON.stringify(event) + "\n";
}
