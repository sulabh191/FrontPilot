import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { getAgentSettings } from "@/features/agent-setup";
import { encodeChatEvent, type ChatEvent } from "@/shared/contracts/chat-events";
import type { Tenant } from "@/shared/lib/tenant";
import { getBusinessFacts } from "./knowledge";
import { AGENT_MODEL, getLlmClient } from "./llm-client";
import { buildSystemPrompt } from "./system-prompt";
import { getEnabledTools, suggestReplies, suggestRepliesInput, type ToolContext } from "./tools";

export type AgentMessage = { role: "user" | "assistant"; content: string };

export type AgentResult = { text: string; inputTokens: number; outputTokens: number };

type RunAgentOptions = {
  conversationId: string;
  // Called once the full reply is known, e.g. to save it. The agent itself
  // does not know about the database.
  onFinish?: (result: AgentResult) => Promise<void>;
};

// Safety limit: at most this many model calls per customer message
// (e.g. check availability → book → final answer).
const MAX_STEPS = 4;

// Runs one agent turn: the model may call tools, see their results and continue,
// until it gives its final answer. Returns a stream of chat events (NDJSON).
export async function runAgent(
  tenant: Tenant,
  history: AgentMessage[],
  options: RunAgentOptions,
): Promise<ReadableStream<Uint8Array>> {
  const settings = await getAgentSettings(tenant.id);
  const businessFacts = await getBusinessFacts(tenant.id);
  const system = buildSystemPrompt({
    businessName: tenant.name,
    settings,
    businessFacts,
    now: new Date(),
    timeZone: tenant.timeZone,
  });

  const tools = getEnabledTools(settings);
  const toolsByName = new Map(tools.map((tool) => [tool.definition.name, tool]));
  const ctx: ToolContext = { tenant, conversationId: options.conversationId, settings };
  const client = getLlmClient();
  const abort = new AbortController();

  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ChatEvent) => controller.enqueue(encoder.encode(encodeChatEvent(event)));
      const messages: Anthropic.MessageParam[] = [...history];
      let fullText = "";
      let suggestions: string[] | null = null;
      let inputTokens = 0;
      let outputTokens = 0;

      try {
        for (let step = 1; step <= MAX_STEPS; step++) {
          const stream = client.messages.stream(
            {
              model: AGENT_MODEL,
              max_tokens: 600,
              system,
              messages,
              tools: tools.map((tool) => tool.definition),
            },
            { signal: abort.signal },
          );

          // 1. Stream any text the model writes in this step.
          let startedThisStep = false;
          for await (const event of stream) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              if (!startedThisStep && fullText && !/\s$/.test(fullText)) {
                fullText += "\n";
                send({ type: "text", text: "\n" }); // separate text from an earlier step
              }
              startedThisStep = true;
              fullText += event.delta.text;
              send({ type: "text", text: event.delta.text });
            }
          }
          const final = await stream.finalMessage();
          inputTokens += final.usage.input_tokens;
          outputTokens += final.usage.output_tokens;

          const toolCalls = final.content.filter(
            (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
          );
          for (const call of toolCalls) {
            if (call.name === suggestReplies.definition.name) {
              const parsed = suggestRepliesInput.safeParse(call.input);
              if (parsed.success) suggestions = parsed.data.options;
            }
          }

          // 2. Done when the model stops asking for tools (only display tools left counts as done).
          const needsResults = toolCalls.some((call) => call.name !== suggestReplies.definition.name);
          if (final.stop_reason !== "tool_use" || !needsResults) break;

          // 3. Run the tools and give the results back to the model for the next step.
          //    Every tool call needs a result, including display-only ones.
          const results: Anthropic.ToolResultBlockParam[] = await Promise.all(
            toolCalls.map(async (call) => {
              const tool = toolsByName.get(call.name);
              const output = tool
                ? await tool.execute(call.input, ctx).catch((error: unknown) => {
                    console.error(`[agent] tool ${call.name} failed`, error);
                    return { content: "The tool failed. Apologize and offer a callback.", isError: true };
                  })
                : { content: `Unknown tool ${call.name}`, isError: true };
              console.info(`[agent] tool=${call.name} error=${output.isError ? "yes" : "no"}`);
              return {
                type: "tool_result",
                tool_use_id: call.id,
                content: output.content,
                is_error: output.isError,
              };
            }),
          );
          messages.push({ role: "assistant", content: final.content });
          messages.push({ role: "user", content: results });
        }

        if (!fullText.trim()) {
          fullText = "Happy to help. Could you tell me a bit more?";
          send({ type: "text", text: fullText });
        }
        if (suggestions) send({ type: "suggestions", options: suggestions });

        await options.onFinish?.({ text: fullText, inputTokens, outputTokens });
        console.info(
          `[agent] tenant=${tenant.id} model=${AGENT_MODEL} in=${inputTokens} out=${outputTokens}`,
        );
        controller.close();
      } catch (error) {
        if (abort.signal.aborted) return;
        console.error("[agent] run failed", error);
        send({ type: "error", message: "The assistant is unavailable right now." });
        controller.close();
      }
    },
    cancel() {
      abort.abort(); // visitor left: stop generating
    },
  });
}
