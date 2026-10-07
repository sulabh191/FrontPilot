import type Anthropic from "@anthropic-ai/sdk";
import type { AgentSettings } from "../../agent-settings/agent-settings.schemas";
import type { Tenant } from "../../tenants/tenant.types";

// What a tool may know about the current chat. The tenant comes from here,
// never from the model's input, so the model can't act for another business.
export type ToolContext = {
  tenant: Tenant;
  conversationId: string | null; // null in preview mode
  settings: AgentSettings;
};

export type ToolOutput = { content: string; isError?: boolean };

// Every tool: a definition the model sees + code the server runs.
export interface AgentTool {
  readonly definition: Anthropic.Tool;
  readonly sideEffects: boolean; // true = changes data; excluded in preview mode
  execute(input: unknown, ctx: ToolContext): Promise<ToolOutput>;
}
