import { getOverview, OverviewDashboard } from "@/features/overview";
import { PageHeader } from "@/shared/components/page-header";
import { getCurrentTenant } from "@/shared/lib/tenant";

export default async function OverviewPage() {
  const tenant = await getCurrentTenant();
  const data = await getOverview(tenant.id);

  return (
    <>
      <PageHeader title="Overview" description="What your agent handled this week." />
      <OverviewDashboard data={data} />
    </>
  );
}
