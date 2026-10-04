import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

// A display-only tool: the agent calls it to offer tappable replies to the customer.
// Nothing runs on our side except validating and forwarding the options.
export const suggestRepliesTool: Anthropic.Tool = {
  name: "suggest_replies",
  description:
    "Show the customer 2-3 short tappable reply options under your message. Call this AFTER writing your reply, when the customer is likely to answer with one of a few clear choices. Do not call it when you are asking for free-form details like a name, phone number or address.",
  input_schema: {
    type: "object",
    properties: {
      options: {
        type: "array",
        items: { type: "string", description: "A reply written from the customer's point of view, max 5 words." },
        minItems: 2,
        maxItems: 3,
      },
    },
    required: ["options"],
  },
};

// Never trust model output blindly: validate it like any other input.
export const suggestRepliesInput = z.object({
  options: z.array(z.string().trim().min(1).max(40)).min(1).max(3),
});
