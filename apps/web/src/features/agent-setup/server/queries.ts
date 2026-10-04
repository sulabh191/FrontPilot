import "server-only";
import type { AgentSettings } from "../schema";
import { readSettings } from "./store";

export async function getAgentSettings(tenantId: string): Promise<AgentSettings> {
  return readSettings(tenantId);
}
