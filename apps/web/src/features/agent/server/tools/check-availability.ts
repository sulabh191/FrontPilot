import "server-only";
import { z } from "zod";
import { getAvailableSlots } from "@/features/appointments";
import type { AgentTool } from "./types";

const input = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

export const checkAvailability: AgentTool = {
  definition: {
    name: "check_availability",
    description:
      "Get the free appointment times on one day. Always call this before offering or confirming any visit time. Never guess availability.",
    input_schema: {
      type: "object",
      properties: {
        date: { type: "string", description: "Day to check, YYYY-MM-DD, in the business's time zone." },
      },
      required: ["date"],
    },
  },
  async execute(raw, ctx) {
    const parsed = input.safeParse(raw);
    if (!parsed.success) return { content: "Invalid date. Use YYYY-MM-DD.", isError: true };

    const result = await getAvailableSlots(ctx.tenant.id, parsed.data.date);
    if (result.status === "closed") {
      return { content: JSON.stringify({ date: parsed.data.date, available: false, reason: result.reason }) };
    }

    // Give the model both a label to show and the exact value to book with.
    const times = result.slots.map((slot) => ({
      label: slot.toLocaleTimeString("en-US", { timeZone: ctx.tenant.timeZone, hour: "numeric", minute: "2-digit" }),
      value: slot.toLocaleTimeString("en-GB", { timeZone: ctx.tenant.timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }),
    }));
    return { content: JSON.stringify({ date: parsed.data.date, available: true, times }) };
  },
};
