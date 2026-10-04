import type { Lead } from "../types";

// Sample leads for the demo business. Replaced by database queries later.
export const mockLeads: Lead[] = [
  { id: "l1", name: "Priya Shah", service: "Leaking sink", score: "Hot", stage: "New", estimatedValue: 180, source: "Website chat", createdAt: "10 min ago" },
  { id: "l2", name: "Mark Chen", service: "Tankless water heater", score: "Warm", stage: "New", estimatedValue: 3200, source: "Website chat", createdAt: "1 hr ago" },
  { id: "l8", name: "Nina Brooks", service: "Low water pressure", score: "Cold", stage: "New", estimatedValue: 150, source: "Email", createdAt: "2 hrs ago" },
  { id: "l3", name: "Dana Lopez", service: "Drain cleaning", score: "Hot", stage: "Qualified", estimatedValue: 240, source: "Website chat", createdAt: "3 hrs ago" },
  { id: "l4", name: "Sam Patel", service: "Bathroom remodel quote", score: "Warm", stage: "Qualified", estimatedValue: 8500, source: "Phone", createdAt: "Yesterday" },
  { id: "l5", name: "Alex Kim", service: "Burst pipe repair", score: "Hot", stage: "Booked", estimatedValue: 450, source: "Website chat", createdAt: "Yesterday" },
  { id: "l6", name: "Jordan Lee", service: "Toilet repair", score: "Cold", stage: "Booked", estimatedValue: 200, source: "Website chat", createdAt: "2 days ago" },
  { id: "l7", name: "Rita Gomez", service: "Sump pump install", score: "Warm", stage: "Won", estimatedValue: 1250, source: "Email", createdAt: "3 days ago" },
];
