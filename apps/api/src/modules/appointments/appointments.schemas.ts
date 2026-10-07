import { z } from "zod";

export const appointmentStatuses = ["awaiting_approval", "confirmed", "cancelled"] as const;

export const listAppointmentsQuerySchema = z.object({
  status: z.enum(appointmentStatuses).optional(),
  from: z.iso.datetime().optional().describe("Only appointments starting at or after this time"),
});
export type ListAppointmentsQuery = z.infer<typeof listAppointmentsQuerySchema>;

export const appointmentSchema = z.object({
  id: z.uuid(),
  customerName: z.string(),
  service: z.string(),
  address: z.string().nullable(),
  startsAt: z.iso.datetime(),
  status: z.enum(appointmentStatuses),
  bookedBy: z.enum(["ai_agent", "staff"]),
  leadId: z.uuid().nullable(),
});
export const appointmentListSchema = z.object({
  timeZone: z.string().describe("The business's time zone, for displaying startsAt"),
  items: z.array(appointmentSchema),
});
