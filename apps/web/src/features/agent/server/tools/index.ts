import "server-only";
import type { AgentSettings } from "@/features/agent-setup";
import { bookAppointment } from "./book-appointment";
import { checkAvailability } from "./check-availability";
import { suggestReplies } from "./suggest-replies";
import type { AgentTool } from "./types";

export { suggestReplies, suggestRepliesInput } from "./suggest-replies";
export type { AgentTool, ToolContext, ToolOutput } from "./types";

// Only the tools the business switched on in Agent setup are offered to the model.
export function getEnabledTools(settings: AgentSettings): AgentTool[] {
  const tools: AgentTool[] = [suggestReplies];
  if (settings.tools.bookAppointments) tools.push(checkAvailability, bookAppointment);
  return tools;
}
