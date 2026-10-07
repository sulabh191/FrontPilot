import { Injectable } from "@nestjs/common";
import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { AvailabilityService } from "../../availability/availability.service";
import type { AgentTool, ToolContext, ToolOutput } from "./agent-tool";

const input = z.object({ date: z.iso.date() });

@Injectable()
export class CheckAvailabilityTool implements AgentTool {
  readonly sideEffects = false;
  readonly definition: Anthropic.Tool = {
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
  };

  // Same service as GET /v1/availability: one source of truth for slots.
  constructor(private readonly availability: AvailabilityService) {}

  async execute(raw: unknown, ctx: ToolContext): Promise<ToolOutput> {
    const parsed = input.safeParse(raw);
    if (!parsed.success) return { content: "Invalid date. Use YYYY-MM-DD.", isError: true };

    const result = await this.availability.getSlots(ctx.tenant.id, parsed.data.date);
    if (result.status === "closed") {
      return { content: JSON.stringify({ date: parsed.data.date, available: false, reason: result.reason }) };
    }
    const tz = result.timeZone;
    const times = result.slots.map((slot) => ({
      label: slot.toLocaleTimeString("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" }),
      value: slot.toLocaleTimeString("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }),
    }));
    return { content: JSON.stringify({ date: parsed.data.date, available: true, times }) };
  }
}
