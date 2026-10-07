import "server-only";
import { unwrap, type paths } from "@frontpilot/api-client";
import { getApi } from "@/shared/lib/api";
import { formatDateParts } from "@/shared/lib/format";
import type { Appointment, AppointmentStatus } from "../types";

// One appointment exactly as the API returns it (generated types).
type ApiAppointment =
  paths["/v1/appointments"]["get"]["responses"][200]["content"]["application/json"]["items"][number];

const statusLabel: Record<ApiAppointment["status"], AppointmentStatus> = {
  confirmed: "Confirmed",
  awaiting_approval: "Awaiting approval",
  cancelled: "Cancelled",
};

// The business's appointments, soonest first (the API sorts them).
export async function getAppointments(): Promise<Appointment[]> {
  const { timeZone, items } = unwrap(await getApi().GET("/v1/appointments"));

  return items.map((a) => {
    // startsAt is a UTC instant; show it on the business's clock, not the server's.
    const { date, time } = formatDateParts(new Date(a.startsAt), timeZone);
    return {
      id: a.id,
      customer: a.customerName,
      service: a.service,
      date,
      time,
      address: a.address ?? "",
      bookedBy: a.bookedBy === "ai_agent" ? "AI agent" : "Staff",
      status: statusLabel[a.status],
    };
  });
}
