import { z } from "zod";

// POST /v1/agent/preview: the owner tests the agent with a made-up conversation.
export const previewRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(1000),
      }),
    )
    .min(1)
    .max(20)
    .refine((messages) => messages[0]?.role === "user", "The conversation must start with the customer")
    .refine((messages) => messages.at(-1)?.role === "user", "The last message must be from the customer"),
});
export type PreviewRequest = z.infer<typeof previewRequestSchema>;

export const previewResponseSchema = z.object({
  reply: z.string(),
  suggestions: z.array(z.string()).nullable(),
  toolCalls: z.array(z.object({ name: z.string(), isError: z.boolean() })),
  usage: z.object({ model: z.string(), inputTokens: z.number().int(), outputTokens: z.number().int() }),
});
