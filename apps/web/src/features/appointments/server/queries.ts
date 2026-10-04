import type { Appointment } from "../types";
import { mockAppointments } from "./mock-data";

// Appointments for one business, in date order.
export async function getAppointments(tenantId: string): Promise<Appointment[]> {
  void tenantId;
  return mockAppointments;
}
