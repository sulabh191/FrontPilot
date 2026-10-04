import { z } from "zod";
import { runAgent } from "@/features/agent";
import { getTenantBySlug } from "@/shared/lib/tenant";

const chatRequestSchema = z.object({
  tenantSlug: z.string().min(1).max(64),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(1000),
      }),
    )
    .min(1)
    .max(40),
});

// POST /api/v1/chat — public endpoint called by the chat widget.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const tenant = await getTenantBySlug(parsed.data.tenantSlug);
  if (!tenant) {
    return Response.json({ error: "Unknown business" }, { status: 404 });
  }

  // The model expects the conversation to start with the customer, so drop the greeting.
  const messages = parsed.data.messages.slice(
    parsed.data.messages.findIndex((m) => m.role === "user"),
  );
  if (messages.at(-1)?.role !== "user") {
    return Response.json({ error: "Last message must be from the customer" }, { status: 400 });
  }

  try {
    const stream = await runAgent(tenant, messages);
    return new Response(stream, {
      headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[chat] agent failed", error);
    return Response.json({ error: "The assistant is unavailable right now." }, { status: 503 });
  }
}
