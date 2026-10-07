import "server-only";
import { unwrap, type paths } from "@frontpilot/api-client";
import { getApi } from "@/shared/lib/api";
import { formatRelativeTime } from "@/shared/lib/format";
import type { Lead, LeadScore, LeadStage } from "../types";

// One lead exactly as the API returns it (types generated from the OpenAPI spec).
type ApiLead =
  paths["/v1/leads"]["get"]["responses"][200]["content"]["application/json"]["items"][number];

// API codes → the labels the UI shows. Keeping this mapping in one place
// means the API and the UI can each use what suits them.
const stageLabel: Record<Exclude<ApiLead["stage"], "lost">, LeadStage> = {
  new: "New",
  qualified: "Qualified",
  booked: "Booked",
  won: "Won",
};
const scoreLabel: Record<ApiLead["score"], LeadScore> = { hot: "Hot", warm: "Warm", cold: "Cold" };
const sourceLabel: Record<ApiLead["source"], Lead["source"]> = {
  website_chat: "Website chat",
  email: "Email",
  sms: "SMS",
};

// The API knows which business from the token, so no tenantId is passed:
// the browser and this code can't ask for another business's leads.
export async function getLeads(): Promise<Lead[]> {
  const { items } = unwrap(await getApi().GET("/v1/leads"));

  return items
    .filter((lead): lead is ApiLead & { stage: Exclude<ApiLead["stage"], "lost"> } => lead.stage !== "lost")
    .map((lead) => ({
      id: lead.id,
      name: lead.name,
      service: lead.service,
      score: scoreLabel[lead.score],
      stage: stageLabel[lead.stage],
      estimatedValue: lead.estimatedValue ?? 0,
      source: sourceLabel[lead.source],
      createdAt: formatRelativeTime(new Date(lead.createdAt)), // JSON carries dates as ISO strings
    }));
}
