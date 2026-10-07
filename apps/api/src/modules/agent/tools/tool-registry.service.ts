import { Injectable } from "@nestjs/common";
import type { AgentSettings } from "../../agent-settings/agent-settings.schemas";
import type { AgentTool } from "./agent-tool";
import { BookAppointmentTool } from "./book-appointment.tool";
import { CheckAvailabilityTool } from "./check-availability.tool";
import { SuggestRepliesTool } from "./suggest-replies.tool";

// Decides which tools the model is offered for a given business and mode.
@Injectable()
export class ToolRegistry {
  constructor(
    private readonly suggestReplies: SuggestRepliesTool,
    private readonly checkAvailability: CheckAvailabilityTool,
    private readonly bookAppointment: BookAppointmentTool,
  ) {}

  enabledFor(settings: AgentSettings, options: { preview: boolean }): AgentTool[] {
    const tools: AgentTool[] = [this.suggestReplies];
    if (settings.tools.bookAppointments) tools.push(this.checkAvailability, this.bookAppointment);
    // Preview never changes real data.
    return options.preview ? tools.filter((tool) => !tool.sideEffects) : tools;
  }

  isDisplayOnly(name: string): boolean {
    return name === this.suggestReplies.definition.name;
  }
}
