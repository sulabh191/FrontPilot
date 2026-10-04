import "server-only";
import { agentSettings, eq, getDb } from "@frontpilot/db";
import type { AgentSettings } from "../schema";

// Used when a business has not saved any settings yet.
const defaultSettings: AgentSettings = {
  agentName: "Assistant",
  greeting: "Hi! How can I help you today?",
  tone: "friendly",
  instructions: "",
  tools: { answerQuestions: true, qualifyLeads: true, bookAppointments: false, followUps: false },
  approvalMode: "review",
  suggestedQuestions: [],
};

export async function readSettings(tenantId: string): Promise<AgentSettings> {
  const [row] = await getDb()
    .select()
    .from(agentSettings)
    .where(eq(agentSettings.tenantId, tenantId))
    .limit(1);
  if (!row) return defaultSettings;

  return {
    agentName: row.agentName,
    greeting: row.greeting,
    tone: row.tone,
    instructions: row.instructions,
    tools: row.tools,
    approvalMode: row.approvalMode,
    suggestedQuestions: row.suggestedQuestions,
  };
}

// Insert or update ("upsert"): one row per tenant.
export async function writeSettings(tenantId: string, settings: AgentSettings): Promise<void> {
  const values = { ...settings, updatedAt: new Date() };
  await getDb()
    .insert(agentSettings)
    .values({ tenantId, ...values })
    .onConflictDoUpdate({ target: agentSettings.tenantId, set: values });
}
