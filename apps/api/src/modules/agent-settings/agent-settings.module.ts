import { Module } from "@nestjs/common";
import { AgentSettingsController } from "./agent-settings.controller";
import { AgentSettingsRepository } from "./agent-settings.repository";
import { AgentSettingsService } from "./agent-settings.service";

@Module({
  controllers: [AgentSettingsController],
  providers: [AgentSettingsService, AgentSettingsRepository],
  exports: [AgentSettingsService], // the agent (phase E) reads settings through this
})
export class AgentSettingsModule {}
