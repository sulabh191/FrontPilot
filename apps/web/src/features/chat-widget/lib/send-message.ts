import type { ChatMessage } from "../types";

// The one function the widget calls to get a reply.
// Today: canned replies after a short delay, so the UI can be built and tested.
// Step 10: this calls POST /api/v1/chat and the real AI agent. The UI does not change.
export async function sendMessage(tenantSlug: string, history: ChatMessage[]): Promise<string> {
  void tenantSlug;
  const last = history.at(-1)?.content.toLowerCase() ?? "";
  await new Promise((resolve) => setTimeout(resolve, 900));

  if (/(gas|flood|burst|emergency)/.test(last)) {
    return "That sounds urgent. Please call our 24/7 emergency line right away. (Demo reply: the real AI agent arrives in the next step.)";
  }
  if (/(price|cost|how much|quote)/.test(last)) {
    return "Our prices start from $129 depending on the job. What do you need help with? (Demo reply)";
  }
  if (/(book|appointment|schedule|come|available)/.test(last)) {
    return "I can help you book a visit. What's the problem, and what day works for you? (Demo reply)";
  }
  if (/(hour|open|weekend|saturday|sunday)/.test(last)) {
    return "We're open Monday to Friday 7 AM–7 PM and Saturday 8 AM–4 PM. (Demo reply)";
  }
  return "Thanks for your message! I'm a demo assistant for now. Soon I'll answer with real AI. (Demo reply)";
}
