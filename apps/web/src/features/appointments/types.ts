export type AppointmentStatus = "Confirmed" | "Awaiting approval" | "Cancelled";

export type Appointment = {
  id: string;
  customer: string;
  service: string;
  date: string;
  time: string;
  address: string;
  bookedBy: "AI agent" | "Staff";
  status: AppointmentStatus;
};
