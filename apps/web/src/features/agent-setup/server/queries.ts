import "server-only";
import { unwrap } from "@frontpilot/api-client";
import { getApi } from "@/shared/lib/api";
import type { AgentSettings } from "../schema";

// The dashboard's settings, from the API. The API returns defaults if the
// business has never saved any, so this page never sees "no settings".
export async function getAgentSettings(): Promise<AgentSettings> {
  return unwrap(await getApi().GET("/v1/agent-settings"));
}
