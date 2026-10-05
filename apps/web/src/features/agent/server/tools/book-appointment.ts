import "server-only";
import { z } from "zod";
import { bookAppointment as createBooking } from "@/features/appointments";
import { formatInZone } from "@/shared/lib/time-zone";
import type { AgentTool } from "./types";

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
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  address: z.string().trim().min(5, "Need the street address for the visit").max(200),
});

export const bookAppointment: AgentTool = {
  definition: {
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
      },
      required: ["customer_name", "phone", "service", "date", "time", "address"],
    },
  },
  async execute(raw, ctx) {
    const parsed = input.safeParse(raw);
    if (!parsed.success) {
      return { content: `Cannot book: ${parsed.error.issues[0]?.message ?? "invalid details"}.`, isError: true };
    }
    const d = parsed.data;

    const result = await createBooking({
      tenantId: ctx.tenant.id,
      conversationId: ctx.conversationId,
      customerName: d.customer_name,
      phone: d.phone,
      service: d.service,
      date: d.date,
      time: d.time,
      address: d.address,
      requireApproval: ctx.settings.approvalMode === "review",
    });

    if (!result.ok) return { content: result.reason, isError: true };
    return {
      content: JSON.stringify({
        booked: true,
        status: result.status, // "awaiting_approval" or "confirmed"
        when: formatInZone(result.startsAt, ctx.tenant.timeZone),
      }),
    };
  },
};
