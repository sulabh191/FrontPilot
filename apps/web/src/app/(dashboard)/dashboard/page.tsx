import { ComingSoon } from "@/shared/components/coming-soon";
import { PageHeader } from "@/shared/components/page-header";

export default function Page() {
  return (
    <>
      <PageHeader title="Overview" description="What your agent handled this week." />
      <ComingSoon feature="Overview" />
    </>
  );
}
