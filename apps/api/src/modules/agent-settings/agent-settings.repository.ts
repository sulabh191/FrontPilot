import { Inject, Injectable } from "@nestjs/common";
import { agentSettings, eq, type Database } from "@frontpilot/db";
import { DATABASE } from "../../database/database.constants";
import type { AgentSettings } from "./agent-settings.schemas";

@Injectable()
export class AgentSettingsRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async find(tenantId: string) {
    const [row] = await this.db
      .select()
      .from(agentSettings)
      .where(eq(agentSettings.tenantId, tenantId))
      .limit(1);
    return row ?? null;
  }

  // Insert the first time, update after that: one row per business.
  async upsert(tenantId: string, settings: AgentSettings) {
    const values = { ...settings, updatedAt: new Date() };
    await this.db
      .insert(agentSettings)
      .values({ tenantId, ...values })
      .onConflictDoUpdate({ target: agentSettings.tenantId, set: values });
  }
}
