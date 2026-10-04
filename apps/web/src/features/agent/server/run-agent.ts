import "server-only";
import { getAgentSettings } from "@/features/agent-setup";
import { encodeChatEvent, type ChatEvent } from "@/shared/contracts/chat-events";
import type { Tenant } from "@/shared/lib/tenant";
import { getBusinessFacts } from "./knowledge";
import { AGENT_MODEL, getLlmClient } from "./llm-client";
import { buildSystemPrompt } from "./system-prompt";
import { suggestRepliesInput, suggestRepliesTool } from "./tools";

export type AgentMessage = { role: "user" | "assistant"; content: string };

// Runs one agent turn and returns a stream of chat events (NDJSON).
export async function runAgent(
  tenant: Tenant,
  messages: AgentMessage[],
): Promise<ReadableStream<Uint8Array>> {
  const settings = await getAgentSettings(tenant.id);
  const businessFacts = await getBusinessFacts(tenant.id);
  const system = buildSystemPrompt({ businessName: tenant.name, settings, businessFacts });

  const stream = getLlmClient().messages.stream({
    model: AGENT_MODEL,
    max_tokens: 500,
    system,
    messages,
    tools: [suggestRepliesTool],
    tool_choice: { type: "auto" },
  });

  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ChatEvent) => controller.enqueue(encoder.encode(encodeChatEvent(event)));
      let wroteText = false;

      try {
        // 1. Stream the reply text as it is generated.
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            wroteText = true;
            send({ type: "text", text: event.delta.text });
          }
        }

        const final = await stream.finalMessage();
        if (!wroteText) {
          send({ type: "text", text: "Happy to help. Could you tell me a bit more?" });
        }

        // 2. If the agent called suggest_replies, forward its validated options.
        const toolCall = final.content.find(
          (block) => block.type === "tool_use" && block.name === suggestRepliesTool.name,
        );
        if (toolCall?.type === "tool_use") {
          const parsed = suggestRepliesInput.safeParse(toolCall.input);
          if (parsed.success) send({ type: "suggestions", options: parsed.data.options });
        }

        console.info(
          `[agent] tenant=${tenant.id} model=${AGENT_MODEL} in=${final.usage.input_tokens} out=${final.usage.output_tokens} suggestions=${toolCall ? "yes" : "no"}`,
        );
        controller.close();
      } catch (error) {
        console.error("[agent] stream failed", error);
        send({ type: "error", message: "The assistant is unavailable right now." });
        controller.close();
      }
    },
    cancel() {
      stream.abort();
    },
  });
}
