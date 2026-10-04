import { ComingSoon } from "@/shared/components/coming-soon";
import { PageHeader } from "@/shared/components/page-header";

export default function Page() {
  return (
    <>
      <PageHeader title="Conversations" description="Every chat your agent has had with your customers." />
      <ComingSoon feature="Conversations" />
    </>
  );
}
