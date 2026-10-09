import "server-only";
import { agentSettings, eq, getDb } from "@frontpilot/db";
import type { AgentSettings } from "../schema";

// LEGACY: the chat path (run-agent, widget config) still reads settings straight
// from the database for the widget's business. The dashboard uses the API instead.
// This file is deleted in F4, once chat runs on the API.

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
