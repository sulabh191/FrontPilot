import { z } from "zod";

export const overviewSchema = z.object({
  period: z.object({ from: z.iso.datetime(), to: z.iso.datetime() }),
  stats: z.object({
    conversations: z.number().int(),
    resolvedByAi: z.number().int(),
    aiResolutionRate: z.number().describe("0–1: share of conversations finished without a human"),
    newLeads: z.number().int(),
    appointmentsBooked: z.number().int(),
  }),
  needsAttention: z.array(
    z.object({
      conversationId: z.uuid(),
      customerName: z.string().nullable(),
      lastCustomerMessage: z.string().nullable(),
      summary: z.string().nullable(),
      updatedAt: z.iso.datetime(),
    }),
  ),
  upcomingAppointments: z.array(
    z.object({
      id: z.uuid(),
      customerName: z.string(),
      service: z.string(),
      startsAt: z.iso.datetime(),
      status: z.enum(["awaiting_approval", "confirmed"]),
    }),
  ),
  timeZone: z.string(),
});
