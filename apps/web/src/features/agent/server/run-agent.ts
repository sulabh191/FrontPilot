import "server-only";
import { getAgentSettings } from "@/features/agent-setup";
import type { Tenant } from "@/shared/lib/tenant";
import { getBusinessFacts } from "./knowledge";
import { AGENT_MODEL, getLlmClient } from "./llm-client";
import { buildSystemPrompt } from "./system-prompt";

export type AgentMessage = { role: "user" | "assistant"; content: string };

// Runs one agent turn and returns the reply as a stream of text chunks.
export async function runAgent(
  tenant: Tenant,
  messages: AgentMessage[],
): Promise<ReadableStream<Uint8Array>> {
  const settings = await getAgentSettings(tenant.id);
  const businessFacts = await getBusinessFacts(tenant.id);
  const system = buildSystemPrompt({ businessName: tenant.name, settings, businessFacts });

  const stream = getLlmClient().messages.stream({
    model: AGENT_MODEL,
    max_tokens: 400,
    system,
    messages,
  });

  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        // Basic usage logging; becomes proper tracing and cost tracking later.
        console.info(
          `[agent] tenant=${tenant.id} model=${AGENT_MODEL} in=${final.usage.input_tokens} out=${final.usage.output_tokens}`,
        );
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
    cancel() {
      stream.abort(); // visitor closed the chat: stop paying for tokens
    },
  });
}
