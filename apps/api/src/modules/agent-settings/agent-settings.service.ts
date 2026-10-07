import { Injectable } from "@nestjs/common";
import { AgentSettingsRepository } from "./agent-settings.repository";
import type { AgentSettings } from "./agent-settings.schemas";

// What a business gets before it has saved anything.
export const DEFAULT_AGENT_SETTINGS: AgentSettings = {
  agentName: "Assistant",
  greeting: "Hi! How can I help you today?",
  tone: "friendly",
  instructions: "",
  tools: { answerQuestions: true, qualifyLeads: true, bookAppointments: false, followUps: false },
  approvalMode: "review",
  suggestedQuestions: [],
};

@Injectable()
export class AgentSettingsService {
  constructor(private readonly repo: AgentSettingsRepository) {}

  async get(tenantId: string): Promise<AgentSettings> {
    const row = await this.repo.find(tenantId);
    if (!row) return DEFAULT_AGENT_SETTINGS;
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

  async update(tenantId: string, settings: AgentSettings): Promise<AgentSettings> {
    await this.repo.upsert(tenantId, settings);
    return this.get(tenantId);
  }
}
