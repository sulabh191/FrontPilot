import { getLeads, LeadsBoard } from "@/features/leads";
import { PageHeader } from "@/shared/components/page-header";
import { getCurrentTenant } from "@/shared/lib/tenant";

export default async function LeadsPage() {
  const tenant = await getCurrentTenant();
  const leads = await getLeads(tenant.id);

  return (
    <>
      <PageHeader title="Leads" description="Your pipeline, from new lead to won job." />
      <LeadsBoard leads={leads} />
    </>
  );
}
