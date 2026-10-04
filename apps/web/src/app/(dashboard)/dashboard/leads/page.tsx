import { ComingSoon } from "@/shared/components/coming-soon";
import { PageHeader } from "@/shared/components/page-header";

export default function Page() {
  return (
    <>
      <PageHeader title="Leads" description="Your pipeline, from new lead to won job." />
      <ComingSoon feature="Leads" />
    </>
  );
}
