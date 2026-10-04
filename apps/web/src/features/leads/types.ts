export const leadStages = ["New", "Qualified", "Booked", "Won"] as const;
export type LeadStage = (typeof leadStages)[number];

export type LeadScore = "Hot" | "Warm" | "Cold";

export type Lead = {
  id: string;
  name: string;
  service: string;
  score: LeadScore;
  stage: LeadStage;
  estimatedValue: number;
  source: "Website chat" | "Email" | "SMS";
  createdAt: string;
};
