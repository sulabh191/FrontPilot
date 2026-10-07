import { Injectable } from "@nestjs/common";
import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { formatInZone } from "../../../common/time/time-zone";
import { BookingService } from "../../appointments/booking.service";
import type { AgentTool, ToolContext, ToolOutput } from "./agent-tool";

const input = z.object({
  customer_name: z.string().trim().min(2).max(80),
  phone: z
    .string()
    .trim()
    .refine((value) => {
      const digits = value.replace(/\D/g, "");
      return digits.length >= 7 && digits.length <= 15;
    }, "Phone number looks invalid"),
  service: z.string().trim().min(2).max(120),
  date: z.iso.date(),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  address: z.string().trim().min(5, "Need the street address for the visit").max(200),
  sms_consent: z.boolean(),
});

@Injectable()
export class BookAppointmentTool implements AgentTool {
  readonly sideEffects = true;
  readonly definition: Anthropic.Tool = {
    name: "book_appointment",
    description:
      "Book a visit for the customer. Only call this after check_availability returned the time, and after the customer gave their name, phone number and street address and agreed to the time.",
    input_schema: {
      type: "object",
      properties: {
        customer_name: { type: "string" },
        phone: { type: "string" },
        service: { type: "string", description: "Short description of the job, e.g. 'Kitchen sink leak'." },
        date: { type: "string", description: "YYYY-MM-DD" },
        time: { type: "string", description: "The exact 'value' from check_availability, HH:MM 24-hour." },
        address: { type: "string", description: "Street address where the work is needed." },
        sms_consent: {
          type: "boolean",
          description: "true only if the customer said yes to receiving text updates about this booking.",
        },
      },
      required: ["customer_name", "phone", "service", "date", "time", "address", "sms_consent"],
    },
  };

  constructor(private readonly booking: BookingService) {}

  async execute(raw: unknown, ctx: ToolContext): Promise<ToolOutput> {
    if (!ctx.conversationId) return { content: "Booking is not available here.", isError: true };
    const parsed = input.safeParse(raw);
    if (!parsed.success) {
      return { content: `Cannot book: ${parsed.error.issues[0]?.message ?? "invalid details"}.`, isError: true };
    }
    const d = parsed.data;

    const result = await this.booking.book({
      tenantId: ctx.tenant.id,
      conversationId: ctx.conversationId,
      customerName: d.customer_name,
      phone: d.phone,
      service: d.service,
      date: d.date,
      time: d.time,
      address: d.address,
      smsConsent: d.sms_consent,
      requireApproval: ctx.settings.approvalMode === "review",
    });

    if (!result.ok) return { content: result.reason, isError: true };
    return {
      content: JSON.stringify({
        booked: true,
        status: result.status,
        when: formatInZone(result.startsAt, ctx.tenant.timeZone),
      }),
    };
  }
}
