import { ComingSoon } from "@/shared/components/coming-soon";
import { PageHeader } from "@/shared/components/page-header";

export default function Page() {
  return (
    <>
      <PageHeader title="Agent setup" description="Your agent's name, tone, knowledge and what it is allowed to do." />
      <ComingSoon feature="Agent setup" />
    </>
  );
}
