import "server-only";
import { z } from "zod";
import type { AgentTool } from "./types";

// Display-only: the options are forwarded to the widget as tappable buttons.
export const suggestRepliesInput = z.object({
  options: z.array(z.string().trim().min(1).max(40)).min(1).max(3),
});

export const suggestReplies: AgentTool = {
  definition: {
    name: "suggest_replies",
    description:
      "Show the customer 2-3 short tappable reply options under your message. Call this AFTER writing your reply, when the customer is likely to answer with one of a few clear choices (for example available times). Do not call it when asking for free-form details like a name, phone number or address.",
    input_schema: {
      type: "object",
      properties: {
        options: {
          type: "array",
          items: { type: "string", description: "A reply in the customer's voice, max 5 words." },
          minItems: 2,
          maxItems: 3,
        },
      },
      required: ["options"],
    },
  },
  execute: async () => ({ content: "Options shown to the customer." }),
};
