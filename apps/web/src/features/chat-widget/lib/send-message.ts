import type { ChatMessage } from "../types";

// Sends the conversation to the FrontPilot agent and streams the reply.
// `onText` is called with each new piece of text as it arrives.
// Resolves with the full reply when the stream ends.
export async function sendMessage(
  tenantSlug: string,
  history: ChatMessage[],
  onText: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const response = await fetch("/api/v1/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tenantSlug,
      messages: history.map(({ role, content }) => ({ role, content })),
    }),
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`Chat request failed with status ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    fullText += chunk;
    onText(chunk);
  }

  return fullText;
}
