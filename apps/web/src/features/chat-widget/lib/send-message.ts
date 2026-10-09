import { chatEventSchema, type ChatRequest } from "@/shared/contracts/chat-events";

// The FrontPilot API, called straight from the visitor's browser.
// NEXT_PUBLIC_ settings are copied into the browser bundle, so this must never be a secret:
// it's just an address. (Changing it needs a dev-server restart.)
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// The API refused the message before any reply started (e.g. 429 too many messages).
export class ChatRequestError extends Error {
  constructor(readonly status: number) {
    super(`Chat request failed with status ${status}`);
    this.name = "ChatRequestError";
  }
}

type Handlers = {
  onConversation: (conversationId: string) => void;
  onText: (chunk: string) => void;
  onSuggestions: (options: string[]) => void;
};

// Sends ONE new message to the FrontPilot agent and reads the streamed
// events (one JSON object per line) as they arrive.
export async function sendMessage(
  request: ChatRequest,
  handlers: Handlers,
  signal?: AbortSignal,
): Promise<void> {
  // A different origin (port 4000), so the browser checks CORS first; the API
  // allows any website on its public chat routes, without cookies.
  const response = await fetch(`${API_URL}/v1/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok || !response.body) {
    throw new ChatRequestError(response.status);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const handleLine = (line: string) => {
    if (!line.trim()) return;
    const parsed = chatEventSchema.safeParse(JSON.parse(line));
    if (!parsed.success) return; // ignore unknown events, so the server can add new types safely
    const event = parsed.data;
    if (event.type === "conversation") handlers.onConversation(event.conversationId);
    if (event.type === "text") handlers.onText(event.text);
    if (event.type === "suggestions") handlers.onSuggestions(event.options);
    if (event.type === "error") throw new Error(event.message);
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    // A network chunk can end in the middle of a line: keep the unfinished part.
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    lines.forEach(handleLine);
  }
  handleLine(buffer);
}
