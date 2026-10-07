import { z } from "zod";

export const availabilityQuerySchema = z.object({
  date: z.iso.date().describe("Day to check, YYYY-MM-DD, in the business's time zone"),
});
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;

export const availabilitySchema = z.object({
  date: z.iso.date(),
  timeZone: z.string(),
  available: z.boolean(),
  reason: z.string().optional().describe("Why nothing is available, when available is false"),
  slots: z.array(
    z.object({
      startsAt: z.iso.datetime(),
      label: z.string().describe("Local time for display, e.g. 9:00 AM"),
      value: z.string().describe("Local time, 24-hour HH:MM"),
    }),
  ),
});
