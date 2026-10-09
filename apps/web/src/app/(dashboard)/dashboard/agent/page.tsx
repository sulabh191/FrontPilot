import { AgentSettingsForm, getAgentSettings } from "@/features/agent-setup";
import { PageHeader } from "@/shared/components/page-header";

export default async function AgentSetupPage() {
  const settings = await getAgentSettings();

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
