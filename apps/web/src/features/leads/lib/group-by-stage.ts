import { leadStages, type Lead, type LeadStage } from "../types";

// Pure function: easy to unit test, no UI or data-access concerns.
export function groupByStage(leads: Lead[]): Record<LeadStage, Lead[]> {
  const groups = Object.fromEntries(leadStages.map((stage) => [stage, [] as Lead[]])) as Record<
    LeadStage,
    Lead[]
  >;
  for (const lead of leads) {
    groups[lead.stage].push(lead);
  }
  return groups;
}

