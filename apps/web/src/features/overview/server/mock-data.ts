import type { OverviewData } from "../types";

// Sample data for the demo business. Replaced by database queries later.
export const mockOverview: OverviewData = {
  stats: [
    { label: "Conversations", value: "128", trend: "+18% vs last week" },
    { label: "New leads", value: "34", trend: "+9 vs last week" },
    { label: "Appointments booked", value: "21", trend: "+6 vs last week" },
    { label: "Handled by AI", value: "82%", trend: "No human needed" },
  ],
  needsAttention: [
    {
      id: "c1",
      customer: "Priya Shah",
      message: "Under the sink. 2:30 works for me.",
      reason: "Booking waiting for your approval",
      receivedAt: "10 min ago",
    },
    {
      id: "c3",
      customer: "Mark Chen",
      message: "Can you give me a quote for a tankless water heater?",
      reason: "Asked for a custom quote",
      receivedAt: "1 hr ago",
    },
  ],
  upcoming: [
    {
      id: "a1",
      customer: "Alex Kim",
      service: "Burst pipe repair",
      when: "Mon, Oct 5 · 9:00 AM",
      status: "Confirmed",
    },
    {
      id: "a2",
      customer: "Priya Shah",
      service: "Leaking sink",
      when: "Mon, Oct 5 · 2:30 PM",
      status: "Awaiting approval",
    },
    {
      id: "a3",
      customer: "Jordan Lee",
      service: "Toilet repair",
      when: "Tue, Oct 6 · 11:00 AM",
      status: "Confirmed",
    },
  ],
};
