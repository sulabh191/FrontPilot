// Public API of the appointments feature.
export { ApprovalBanner } from "./components/approval-banner";
export { AppointmentsTable } from "./components/appointments-table";
export { getAppointments } from "./server/queries";
export type { Appointment, AppointmentStatus } from "./types";
