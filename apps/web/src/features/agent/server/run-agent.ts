import "server-only";
import { getAgentSettings } from "@/features/agent-setup";
import { encodeChatEvent, type ChatEvent } from "@/shared/contracts/chat-events";
import type { Tenant } from "@/shared/lib/tenant";
import { getBusinessFacts, getBusinessTimeZone } from "./knowledge";
import { AGENT_MODEL, getLlmClient } from "./llm-client";
import { buildSystemPrompt } from "./system-prompt";
import { suggestRepliesInput, suggestRepliesTool } from "./tools";

export type AgentMessage = { role: "user" | "assistant"; content: string };

export type AgentResult = { text: string; inputTokens: number; outputTokens: number };

type RunAgentOptions = {
  // Called once the full reply is known, e.g. to save it. The agent itself
  // does not know about the database.
  onFinish?: (result: AgentResult) => Promise<void>;
};

// Runs one agent turn and returns a stream of chat events (NDJSON).
export async function runAgent(
  tenant: Tenant,
  messages: AgentMessage[],
  options: RunAgentOptions = {},
): Promise<ReadableStream<Uint8Array>> {
  const settings = await getAgentSettings(tenant.id);
  const [businessFacts, timeZone] = await Promise.all([
    getBusinessFacts(tenant.id),
    getBusinessTimeZone(tenant.id),
  ]);
  const system = buildSystemPrompt({
    businessName: tenant.name,
    settings,
    businessFacts,
    now: new Date(),
    timeZone,
  });

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
      let fullText = "";

      try {
        // 1. Stream the reply text as it is generated.
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            fullText += event.delta.text;
            send({ type: "text", text: event.delta.text });
          }
        }

        const final = await stream.finalMessage();
        if (!fullText) {
          fullText = "Happy to help. Could you tell me a bit more?";
          send({ type: "text", text: fullText });
        }

        // 2. If the agent called suggest_replies, forward its validated options.
        const toolCall = final.content.find(
          (block) => block.type === "tool_use" && block.name === suggestRepliesTool.name,
        );
        if (toolCall?.type === "tool_use") {
          const parsed = suggestRepliesInput.safeParse(toolCall.input);
          if (parsed.success) send({ type: "suggestions", options: parsed.data.options });
        }

        await options.onFinish?.({
          text: fullText,
          inputTokens: final.usage.input_tokens,
          outputTokens: final.usage.output_tokens,
        });

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
