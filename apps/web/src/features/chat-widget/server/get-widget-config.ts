import "server-only";
import { getAgentSettings } from "@/features/agent-setup";
import { getTenantBySlug } from "@/shared/lib/tenant";
import type { WidgetConfig } from "../types";

export async function getWidgetConfig(slug: string): Promise<WidgetConfig | null> {
  const tenant = await getTenantBySlug(slug);
  if (!tenant) return null;

  const settings = await getAgentSettings(tenant.id);
  // Pick only public fields; instructions and tool settings stay on the server.
  return {
    tenantSlug: tenant.slug,
    businessName: tenant.name,
    agentName: settings.agentName,
    greeting: settings.greeting,
    suggestedQuestions: settings.suggestedQuestions,
  };
}
