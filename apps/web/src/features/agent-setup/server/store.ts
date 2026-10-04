import "server-only";
import type { AgentSettings } from "../schema";

const defaultSettings: AgentSettings = {
  agentName: "Rapid Plumbing Assistant",
  greeting: "Hi! I'm the Rapid Plumbing assistant. How can I help with your plumbing today?",
  tone: "friendly",
  instructions:
    "Never quote prices for jobs not on the price list; offer a free estimate instead.\nFor gas smells or flooding, tell the customer to call our emergency line right away.",
  tools: { answerQuestions: true, qualifyLeads: true, bookAppointments: true, followUps: false },
  approvalMode: "review",
  suggestedQuestions: ["Book a visit", "How much does it cost?", "I have an emergency", "What are your hours?"],
};

// Temporary in-memory storage, keyed by tenant. It resets when the server
// restarts. Replaced by a Postgres table in the database step.
// Stored on globalThis so dev hot-reloads and API routes share the same map.
const globalStore = globalThis as unknown as { __agentSettings?: Map<string, AgentSettings> };
const settingsByTenant = (globalStore.__agentSettings ??= new Map<string, AgentSettings>());

export function readSettings(tenantId: string): AgentSettings {
  // Merge with defaults so settings saved before a new field existed still work.
  return { ...defaultSettings, ...settingsByTenant.get(tenantId) };
}

export function writeSettings(tenantId: string, settings: AgentSettings): void {
  settingsByTenant.set(tenantId, settings);
}
