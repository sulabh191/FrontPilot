import { Module } from "@nestjs/common";
import { AgentSettingsModule } from "../agent-settings/agent-settings.module";
import { AppointmentsModule } from "../appointments/appointments.module";
import { AvailabilityModule } from "../availability/availability.module";
import { AgentController } from "./agent.controller";
import { AgentService } from "./agent.service";
import { BusinessFactsService } from "./knowledge/business-facts.service";
import { llmProviders } from "./llm/llm.providers";
import { AGENT_RUNNER } from "./runner/agent-runner";
import { ToolLoopAgentRunner } from "./runner/tool-loop.agent-runner";
import { BookAppointmentTool } from "./tools/book-appointment.tool";
import { CheckAvailabilityTool } from "./tools/check-availability.tool";
import { SuggestRepliesTool } from "./tools/suggest-replies.tool";
import { ToolRegistry } from "./tools/tool-registry.service";

@Module({
  imports: [AgentSettingsModule, AvailabilityModule, AppointmentsModule],
  controllers: [AgentController],
  providers: [
    ...llmProviders,
    AgentService,
    BusinessFactsService,
    ToolRegistry,
    SuggestRepliesTool,
    CheckAvailabilityTool,
    BookAppointmentTool,
    // Swap this line to change how the agent is orchestrated (e.g. a LangGraph runner).
    { provide: AGENT_RUNNER, useClass: ToolLoopAgentRunner },
  ],
  exports: [AgentService], // the public chat endpoint (E2) uses it
})
export class AgentModule {}
