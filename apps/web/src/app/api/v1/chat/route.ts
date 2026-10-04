import { runAgent } from "@/features/agent";
import {
  appendMessage,
  countMessages,
  createConversation,
  findConversation,
  getRecentMessages,
  MAX_MESSAGES_PER_CONVERSATION,
} from "@/features/conversations";
import { chatRequestSchema, encodeChatEvent } from "@/shared/contracts/chat-events";
import { getTenantBySlug } from "@/shared/lib/tenant";

// POST /api/v1/chat — public endpoint called by the chat widget.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const { tenantSlug, conversationId: requestedId, message } = parsed.data;

  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) {
    return Response.json({ error: "Unknown business" }, { status: 404 });
  }

  // Continue an existing conversation (only if it belongs to this business) or start one.
  let conversationId: string;
  if (requestedId) {
    const existing = await findConversation(requestedId, tenant.id);
    if (!existing) return Response.json({ error: "Conversation not found" }, { status: 404 });
    conversationId = existing.id;
    if ((await countMessages(conversationId)) >= MAX_MESSAGES_PER_CONVERSATION) {
      return Response.json({ error: "This conversation is too long" }, { status: 429 });
    }
  } else {
    conversationId = await createConversation(tenant.id);
  }

  await appendMessage({ conversationId, tenantId: tenant.id, role: "user", content: message });

  // The history comes from the database, never from the browser.
  const history = await getRecentMessages(conversationId);

  try {
    const agentStream = await runAgent(tenant, history, {
      onFinish: (result) =>
        appendMessage({
          conversationId,
          tenantId: tenant.id,
          role: "assistant",
          content: result.text,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
        }),
    });

    // First tell the widget which conversation this is, then pass the agent's events through.
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        controller.enqueue(encoder.encode(encodeChatEvent({ type: "conversation", conversationId })));
        const reader = agentStream.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
        controller.close();
      },
      cancel() {
        void agentStream.cancel();
      },
    });

    return new Response(body, {
      headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[chat] agent failed", error);
    return Response.json({ error: "The assistant is unavailable right now." }, { status: 503 });
  }
}
