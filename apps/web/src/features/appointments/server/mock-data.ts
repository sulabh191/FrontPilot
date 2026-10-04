import type { Appointment } from "../types";

export const mockAppointments: Appointment[] = [
  { id: "a1", customer: "Alex Kim", service: "Burst pipe repair", date: "Mon, Oct 5", time: "9:00 AM", address: "14 Elm St", bookedBy: "AI agent", status: "Confirmed" },
  { id: "a2", customer: "Priya Shah", service: "Leaking sink", date: "Mon, Oct 5", time: "2:30 PM", address: "88 Lake Ave", bookedBy: "AI agent", status: "Awaiting approval" },
  { id: "a3", customer: "Jordan Lee", service: "Toilet repair", date: "Tue, Oct 6", time: "11:00 AM", address: "3 Birch Rd", bookedBy: "AI agent", status: "Confirmed" },
  { id: "a4", customer: "Sam Patel", service: "Bathroom remodel estimate", date: "Wed, Oct 7", time: "10:00 AM", address: "52 Oak Ln", bookedBy: "Staff", status: "Confirmed" },
  { id: "a5", customer: "Dana Lopez", service: "Drain cleaning", date: "Wed, Oct 7", time: "4:00 PM", address: "7 Pine Ct", bookedBy: "AI agent", status: "Cancelled" },
];
