import type { AgentTool, ToolContext } from "../tools/agent-tool";

export type AgentMessage = { role: "user" | "assistant"; content: string };

// What the agent emits while it works (the chat endpoint streams these to the widget).
export type AgentEvent = { type: "text"; text: string } | { type: "suggestions"; options: string[] };

export type AgentRunInput = {
  system: string;
  history: AgentMessage[];
  tools: AgentTool[];
  context: ToolContext;
};

export type AgentRunResult = {
  text: string;
  suggestions: string[] | null;
  toolCalls: { name: string; isError: boolean }[];
  inputTokens: number;
  outputTokens: number;
  model: string;
};

// HOW the agent works (orchestration) is hidden behind this interface.
// ToolLoopAgentRunner is our hand-written loop; a LangGraph-based runner
// could be a second implementation, swapped in the module without other changes.
export interface AgentRunner {
  run(input: AgentRunInput, onEvent: (event: AgentEvent) => void, signal?: AbortSignal): Promise<AgentRunResult>;
}

export const AGENT_RUNNER = Symbol("AGENT_RUNNER");
