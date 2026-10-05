// Public API of the appointments feature.
export { ApprovalBanner } from "./components/approval-banner";
export { AppointmentsTable } from "./components/appointments-table";
export { getAppointments } from "./server/queries";
export { getAvailableSlots, type AvailabilityResult } from "./server/availability";
export { bookAppointment, type BookingRequest, type BookingResult } from "./server/booking";
export type { Appointment, AppointmentStatus } from "./types";
