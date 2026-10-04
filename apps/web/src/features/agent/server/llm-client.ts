import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// Fast and low-cost by default; override with ANTHROPIC_MODEL to compare models.
export const AGENT_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001";

let client: Anthropic | null = null;

// One shared client. It reads ANTHROPIC_API_KEY from the environment (server only).
export function getLlmClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set. Add it to apps/web/.env.local.");
  }
  client ??= new Anthropic();
  return client;
}
