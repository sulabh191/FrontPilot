import "server-only";
import { and, desc, eq, getDb, leads, ne, type LeadRow } from "@frontpilot/db";
import { formatRelativeTime } from "@/shared/lib/format";
import type { Lead, LeadScore, LeadStage } from "../types";

// Database values → the labels the UI shows. Keeping this mapping in one
// place means the database and the UI can each use what suits them.
const stageLabel: Record<Exclude<LeadRow["stage"], "lost">, LeadStage> = {
  new: "New",
  qualified: "Qualified",
  booked: "Booked",
  won: "Won",
};
const scoreLabel: Record<LeadRow["score"], LeadScore> = { hot: "Hot", warm: "Warm", cold: "Cold" };
const sourceLabel: Record<LeadRow["source"], Lead["source"]> = {
  website_chat: "Website chat",
  email: "Email",
  sms: "SMS",
};

export async function getLeads(tenantId: string): Promise<Lead[]> {
  const rows = await getDb()
    .select()
    .from(leads)
    .where(and(eq(leads.tenantId, tenantId), ne(leads.stage, "lost")))
    .orderBy(desc(leads.createdAt));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    service: row.service,
    score: scoreLabel[row.score],
    stage: stageLabel[row.stage as Exclude<LeadRow["stage"], "lost">],
    estimatedValue: row.estimatedValue ?? 0,
    source: sourceLabel[row.source],
    createdAt: formatRelativeTime(row.createdAt),
  }));
}
