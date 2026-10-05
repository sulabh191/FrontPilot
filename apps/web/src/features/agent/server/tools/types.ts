import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import type { AgentSettings } from "@/features/agent-setup";
import type { Tenant } from "@/shared/lib/tenant";

// Everything a tool may need to know about the current chat. Tools get the
// tenant from here, never from the model's input, so the model can't act for another business.
export type ToolContext = {
  tenant: Tenant;
  conversationId: string;
  settings: AgentSettings;
};

export type ToolOutput = { content: string; isError?: boolean };

export type AgentTool = {
  definition: Anthropic.Tool;
  execute: (input: unknown, ctx: ToolContext) => Promise<ToolOutput>;
};
