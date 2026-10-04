import { ComingSoon } from "@/shared/components/coming-soon";
import { PageHeader } from "@/shared/components/page-header";

export default function Page() {
  return (
    <>
      <PageHeader title="Appointments" description="Bookings your agent made, and any waiting for approval." />
      <ComingSoon feature="Appointments" />
    </>
  );
}
