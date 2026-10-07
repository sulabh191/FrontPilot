import { getLeads, LeadsBoard } from "@/features/leads";
import { PageHeader } from "@/shared/components/page-header";

export default async function LeadsPage() {
  const leads = await getLeads();

  return (
    <>
      <PageHeader title="Leads" description="Your pipeline, from new lead to won job." />
      <LeadsBoard leads={leads} />
    </>
  );
}
