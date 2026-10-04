import "server-only";
import { appointments, asc, eq, getDb, type AppointmentRow } from "@frontpilot/db";
import { formatDateParts } from "@/shared/lib/format";
import type { Appointment, AppointmentStatus } from "../types";

const statusLabel: Record<AppointmentRow["status"], AppointmentStatus> = {
  confirmed: "Confirmed",
  awaiting_approval: "Awaiting approval",
  cancelled: "Cancelled",
};

// A tenant's appointments, soonest first.
export async function getAppointments(tenantId: string): Promise<Appointment[]> {
  const rows = await getDb()
    .select()
    .from(appointments)
    .where(eq(appointments.tenantId, tenantId))
    .orderBy(asc(appointments.startsAt));

  return rows.map((row) => {
    const { date, time } = formatDateParts(row.startsAt);
    return {
      id: row.id,
      customer: row.customerName,
      service: row.service,
      date,
      time,
      address: row.address ?? "",
      bookedBy: row.bookedBy === "ai_agent" ? "AI agent" : "Staff",
      status: statusLabel[row.status],
    };
  });
}
