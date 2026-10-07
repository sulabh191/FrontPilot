import { getOverview, OverviewDashboard } from "@/features/overview";
import { PageHeader } from "@/shared/components/page-header";

export default async function OverviewPage() {
  const data = await getOverview();

  return (
    <>
      <PageHeader title="Overview" description="What your agent handled this week." />
      <OverviewDashboard data={data} />
    </>
  );
}
