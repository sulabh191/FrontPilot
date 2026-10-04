import { AppointmentsTable, ApprovalBanner, getAppointments } from "@/features/appointments";
import { PageHeader } from "@/shared/components/page-header";
import { getCurrentTenant } from "@/shared/lib/tenant";

export default async function AppointmentsPage() {
  const tenant = await getCurrentTenant();
  const appointments = await getAppointments(tenant.id);

  return (
    <>
      <PageHeader
        title="Appointments"
        description="Bookings your agent made, and any waiting for your approval."
      />
      <ApprovalBanner appointments={appointments} />
      <AppointmentsTable appointments={appointments} />
    </>
  );
}
