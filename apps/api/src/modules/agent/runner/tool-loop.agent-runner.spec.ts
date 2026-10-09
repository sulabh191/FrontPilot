import { Logger } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentSettings } from "../../agent-settings/agent-settings.schemas";
import type { Tenant } from "../../tenants/tenant.types";
import { LLM_CLIENT, LLM_MODEL } from "../llm/llm.constants";
import type { AgentTool, ToolContext, ToolOutput } from "../tools/agent-tool";
import { ToolRegistry } from "../tools/tool-registry.service";
import type { AgentEvent } from "./agent-runner";
import { ToolLoopAgentRunner } from "./tool-loop.agent-runner";

// The agent loop is real; CLAUDE IS FAKE. Each test scripts what "the model" returns,
// so the loop's behaviour is tested exactly, instantly, and without paying for tokens.

type Step = { text?: string[]; tools?: { name: string; input: unknown }[] };

// One fake model call: streams the text chunks, then reports the final message,
// like the Anthropic SDK's messages.stream() does.
function modelReply({ text = [], tools = [] }: Step) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const chunk of text) {
        yield { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: chunk } };
      }
    },
    finalMessage: async () => ({
      content: [
        ...(text.length ? [{ type: "text", text: text.join("") }] : []),
        ...tools.map((tool, i) => ({ type: "tool_use", id: `call_${i}`, name: tool.name, input: tool.input })),
      ],
      stop_reason: tools.length ? "tool_use" : "end_turn",
      usage: { input_tokens: 100, output_tokens: 10 },
    }),
  };
}

const tenant: Tenant = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Rapid Plumbing",
  slug: "rapid-plumbing",
  timeZone: "America/New_York",
};
const context: ToolContext = { tenant, conversationId: "conv-1", settings: {} as AgentSettings };

describe("ToolLoopAgentRunner", () => {
  let runner: ToolLoopAgentRunner;
  const stream = vi.fn();
  const checkAvailability = {
    definition: { name: "check_availability", input_schema: { type: "object" as const } },
    sideEffects: false,
    execute: vi.fn<(input: unknown, ctx: ToolContext) => Promise<ToolOutput>>(),
  } satisfies AgentTool;

  beforeAll(() => Logger.overrideLogger(false));

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        ToolLoopAgentRunner,
        { provide: LLM_CLIENT, useValue: { messages: { stream } } },
        { provide: LLM_MODEL, useValue: "test-model" },
        { provide: ToolRegistry, useValue: { isDisplayOnly: (name: string) => name === "suggest_replies" } },
      ],
    }).compile();
    runner = moduleRef.get(ToolLoopAgentRunner);
  });

  async function run(tools: AgentTool[] = [checkAvailability], signal?: AbortSignal) {
    const events: AgentEvent[] = [];
    const result = await runner.run(
      { system: "SYSTEM PROMPT", history: [{ role: "user", content: "Do you fix leaks?" }], tools, context },
      (event) => events.push(event),
      signal,
    );
    return { result, events };
  }

  // The messages array sent on the Nth model call (0-based).
  const messagesOfCall = (n: number) => stream.mock.calls[n]![0].messages;

  it("streams a plain answer and stops after one model call", async () => {
    stream.mockReturnValueOnce(modelReply({ text: ["Yes, ", "we fix leaks."] }));

    const { result, events } = await run();

    expect(events).toEqual([
      { type: "text", text: "Yes, " },
      { type: "text", text: "we fix leaks." },
    ]);
    expect(result).toMatchObject({ text: "Yes, we fix leaks.", inputTokens: 100, outputTokens: 10, model: "test-model" });
    expect(stream).toHaveBeenCalledTimes(1);
    expect(stream).toHaveBeenCalledWith(
      expect.objectContaining({ model: "test-model", system: "SYSTEM PROMPT", max_tokens: 600 }),
      { signal: undefined },
    );
  });

  it("runs a requested tool, sends the result back, then answers", async () => {
    checkAvailability.execute.mockResolvedValue({ content: "Free: 09:00, 10:00" });
    stream
      .mockReturnValueOnce(modelReply({ tools: [{ name: "check_availability", input: { date: "2026-10-13" } }] }))
      .mockReturnValueOnce(modelReply({ text: ["We have 9 or 10 AM."] }));

    const { result } = await run();

    // The tool gets the model's input, but the business comes from the server's context.
    expect(checkAvailability.execute).toHaveBeenCalledWith({ date: "2026-10-13" }, context);
    expect(stream).toHaveBeenCalledTimes(2);
    expect(messagesOfCall(1)).toHaveLength(3); // question, tool request, tool result
    expect(messagesOfCall(1).at(-1)).toEqual({
      role: "user",
      content: [{ type: "tool_result", tool_use_id: "call_0", content: "Free: 09:00, 10:00" }],
    });
    expect(result).toMatchObject({
      text: "We have 9 or 10 AM.",
      toolCalls: [{ name: "check_availability", isError: false }],
      inputTokens: 200, // usage is summed across both calls
      outputTokens: 20,
    });
  });

  it("keeps text from two steps readable", async () => {
    checkAvailability.execute.mockResolvedValue({ content: "Free: 09:00" });
    stream
      .mockReturnValueOnce(modelReply({ text: ["Sure."], tools: [{ name: "check_availability", input: {} }] }))
      .mockReturnValueOnce(modelReply({ text: ["9 AM is free."] }));

    const { result } = await run();

    expect(result.text).toBe("Sure.\n9 AM is free.");
  });

  it("shows suggested replies after the text, without another model call", async () => {
    const options = ["Yes, right now", "Just dripping"];
    stream.mockReturnValueOnce(
      modelReply({ text: ["Is it leaking right now?"], tools: [{ name: "suggest_replies", input: { options } }] }),
    );

    const { result, events } = await run();

    expect(stream).toHaveBeenCalledTimes(1);
    expect(events.at(-1)).toEqual({ type: "suggestions", options });
    expect(result.suggestions).toEqual(options);
  });

  it("stops after 4 model calls, even if the model keeps asking for tools", async () => {
    checkAvailability.execute.mockResolvedValue({ content: "Free: 09:00" });
    stream.mockImplementation(() => modelReply({ tools: [{ name: "check_availability", input: {} }] }));

    const { result, events } = await run();

    expect(stream).toHaveBeenCalledTimes(4);
    expect(checkAvailability.execute).toHaveBeenCalledTimes(4);
    // The customer never gets an empty reply.
    expect(events).toEqual([{ type: "text", text: "Happy to help. Could you tell me a bit more?" }]);
    expect(result.text).toBe("Happy to help. Could you tell me a bit more?");
  });

  it("turns a crashing tool into an error result instead of failing the chat", async () => {
    checkAvailability.execute.mockRejectedValue(new Error("database down"));
    stream
      .mockReturnValueOnce(modelReply({ tools: [{ name: "check_availability", input: {} }] }))
      .mockReturnValueOnce(modelReply({ text: ["Sorry, I can't check right now."] }));

    const { result } = await run();

    expect(messagesOfCall(1).at(-1).content[0]).toMatchObject({
      is_error: true,
      content: "The tool failed. Apologize and offer a callback.",
    });
    expect(result.toolCalls).toEqual([{ name: "check_availability", isError: true }]);
    expect(result.text).toBe("Sorry, I can't check right now.");
  });

  it("refuses to run a tool that wasn't offered (e.g. booking in preview mode)", async () => {
    stream
      .mockReturnValueOnce(modelReply({ tools: [{ name: "book_appointment", input: { time: "09:00" } }] }))
      .mockReturnValueOnce(modelReply({ text: ["I can't book here."] }));

    const { result } = await run([checkAvailability]); // booking not offered

    expect(messagesOfCall(1).at(-1).content[0]).toMatchObject({
      is_error: true,
      content: "Unknown tool book_appointment",
    });
    expect(result.toolCalls).toEqual([{ name: "book_appointment", isError: true }]);
  });

  it("passes the abort signal to the model, so a closed chat stops generation", async () => {
    stream.mockReturnValueOnce(modelReply({ text: ["Hi"] }));
    const controller = new AbortController();

    await run([checkAvailability], controller.signal);

    expect(stream).toHaveBeenCalledWith(expect.anything(), { signal: controller.signal });
  });
});
