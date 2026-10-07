import { Inject, Injectable, Logger } from "@nestjs/common";
import type Anthropic from "@anthropic-ai/sdk";
import { LLM_CLIENT, LLM_MODEL } from "../llm/llm.constants";
import { suggestRepliesInput } from "../tools/suggest-replies.tool";
import { ToolRegistry } from "../tools/tool-registry.service";
import type { AgentEvent, AgentRunInput, AgentRunner, AgentRunResult } from "./agent-runner";

const MAX_STEPS = 4; // safety limit on model calls per customer message
const MAX_TOKENS_PER_STEP = 600;

// The agent loop: call the model → if it asks for tools, run them and send the
// results back → repeat until it answers. Text streams out as it is generated.
@Injectable()
export class ToolLoopAgentRunner implements AgentRunner {
  private readonly logger = new Logger("Agent");

  constructor(
    @Inject(LLM_CLIENT) private readonly llm: Anthropic,
    @Inject(LLM_MODEL) private readonly model: string,
    private readonly registry: ToolRegistry,
  ) {}

  async run(input: AgentRunInput, onEvent: (event: AgentEvent) => void, signal?: AbortSignal): Promise<AgentRunResult> {
    const toolsByName = new Map(input.tools.map((tool) => [tool.definition.name, tool]));
    const messages: Anthropic.MessageParam[] = [...input.history];
    const result: AgentRunResult = {
      text: "",
      suggestions: null,
      toolCalls: [],
      inputTokens: 0,
      outputTokens: 0,
      model: this.model,
    };
    const emitText = (text: string) => {
      result.text += text;
      onEvent({ type: "text", text });
    };

    for (let step = 1; step <= MAX_STEPS; step++) {
      const stream = this.llm.messages.stream(
        {
          model: this.model,
          max_tokens: MAX_TOKENS_PER_STEP,
          system: input.system,
          messages,
          tools: input.tools.map((tool) => tool.definition),
        },
        { signal },
      );

      // 1. Stream text from this step (separated from an earlier step's text).
      let startedThisStep = false;
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          if (!startedThisStep && result.text && !/\s$/.test(result.text)) emitText("\n");
          startedThisStep = true;
          emitText(event.delta.text);
        }
      }
      const final = await stream.finalMessage();
      result.inputTokens += final.usage.input_tokens;
      result.outputTokens += final.usage.output_tokens;

      const calls = final.content.filter((block): block is Anthropic.ToolUseBlock => block.type === "tool_use");
      for (const call of calls) {
        if (this.registry.isDisplayOnly(call.name)) {
          const parsed = suggestRepliesInput.safeParse(call.input);
          if (parsed.success) result.suggestions = parsed.data.options;
        }
      }

      // 2. Done when the model stops asking for real (non-display) tools.
      const needsResults = calls.some((call) => !this.registry.isDisplayOnly(call.name));
      if (final.stop_reason !== "tool_use" || !needsResults) break;

      // 3. Run every requested tool (each needs a result, even display-only ones).
      const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
        calls.map(async (call) => {
          const tool = toolsByName.get(call.name);
          const output = tool
            ? await tool.execute(call.input, input.context).catch((error: unknown) => {
                this.logger.error(`Tool ${call.name} threw`, error as Error);
                return { content: "The tool failed. Apologize and offer a callback.", isError: true };
              })
            : { content: `Unknown tool ${call.name}`, isError: true };
          result.toolCalls.push({ name: call.name, isError: Boolean(output.isError) });
          this.logger.log(`tool=${call.name} error=${output.isError ? "yes" : "no"} tenant=${input.context.tenant.id}`);
          return { type: "tool_result", tool_use_id: call.id, content: output.content, is_error: output.isError };
        }),
      );
      messages.push({ role: "assistant", content: final.content });
      messages.push({ role: "user", content: toolResults });
    }

    if (!result.text.trim()) emitText("Happy to help. Could you tell me a bit more?");
    if (result.suggestions) onEvent({ type: "suggestions", options: result.suggestions });

    this.logger.log(
      `tenant=${input.context.tenant.id} model=${this.model} in=${result.inputTokens} out=${result.outputTokens} tools=${result.toolCalls.length}`,
    );
    return result;
  }
}
