import { AgentSettingsForm, getAgentSettings } from "@/features/agent-setup";
import { PageHeader } from "@/shared/components/page-header";
import { getCurrentTenant } from "@/shared/lib/tenant";

export default async function AgentSetupPage() {
  const tenant = await getCurrentTenant();
  const settings = await getAgentSettings(tenant.id);

  return (
    <>
      <PageHeader
        title="Agent setup"
        description="Your agent's name, tone, rules and what it is allowed to do."
      />
      <div className="max-w-3xl">
        <AgentSettingsForm settings={settings} />
      </div>
    </>
  );
}
