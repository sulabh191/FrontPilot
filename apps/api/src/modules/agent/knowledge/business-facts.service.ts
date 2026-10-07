import { Injectable } from "@nestjs/common";

// TEMPORARY: business facts for the prompt, until the knowledge base (RAG) replaces it
// with documents the owner uploads, searched in Qdrant per question.
const FACTS: Record<string, string> = {
  tenant_rapid_plumbing: [
    "Business: Rapid Plumbing. Licensed plumbers in Springfield. Same-day service, upfront prices.",
    "Main phone: (555) 010-2468. 24/7 emergency line: (555) 010-9111.",
    "Service area: Springfield and surrounding towns, within 25 miles.",
    "Hours: Monday – Friday 7:00 AM – 7:00 PM; Saturday 8:00 AM – 4:00 PM; Sunday emergencies only.",
    "Services and starting prices:",
    "- Leak repair: from $149. Sinks, faucets, pipes and fixtures.",
    "- Drain cleaning: from $189. Kitchen, bathroom and main lines.",
    "- Water heaters: from $1,450 installed. Tank and tankless, repair or replace.",
    "- Toilet repair: from $129. Running, clogged or leaking toilets.",
    "- Burst pipes: from $249. Fast response to stop the damage.",
    "- Sump pumps: from $950 installed. Install, replace and test.",
    "Guarantees: Upfront price before any work starts; Licensed and insured technicians; 1-year warranty on labor.",
  ].join("\n"),
};

@Injectable()
export class BusinessFactsService {
  async forTenant(tenantId: string): Promise<string> {
    return FACTS[tenantId] ?? "No business information available.";
  }
}
