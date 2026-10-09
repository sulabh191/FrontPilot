import type { SmsMessage, SmsProvider, SmsResult } from "../src/modules/notifications/sms-provider";

// ---- Fake Claude -------------------------------------------------------------
// Tests script what "the model" replies; the fake streams it like the Anthropic SDK.

export type ModelStep = { text?: string[]; tools?: { name: string; input: unknown }[] };

type ModelCall = {
  system: string;
  messages: { role: string; content: unknown }[];
  tools: { name: string }[];
};

function modelReply({ text = [], tools = [] }: ModelStep) {
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

export class FakeLlm {
  readonly calls: ModelCall[] = [];
  private steps: ModelStep[] = [];

  // Queue the replies for the next model calls, in order.
  script(...steps: ModelStep[]) {
    this.steps.push(...steps);
  }

  reset() {
    this.steps = [];
    this.calls.length = 0;
  }

  // Same shape as the Anthropic client: client.messages.stream(params, options)
  readonly messages = {
    stream: (params: ModelCall) => {
      this.calls.push(structuredClone(params)); // snapshot: the agent mutates its array later
      return modelReply(this.steps.shift() ?? { text: ["(no scripted reply)"] });
    },
  };
}

// ---- Fake SMS ----------------------------------------------------------------
// Records texts instead of sending them, so tests can assert who was texted and what.

export class FakeSms implements SmsProvider {
  readonly name = "fake";
  readonly sent: SmsMessage[] = [];

  async send(message: SmsMessage): Promise<SmsResult> {
    this.sent.push(message);
    return { ok: true, id: `fake-${this.sent.length}` };
  }
}
