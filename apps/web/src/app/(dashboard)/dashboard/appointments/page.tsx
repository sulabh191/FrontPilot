import { AppointmentsTable, ApprovalBanner, getAppointments } from "@/features/appointments";
import { PageHeader } from "@/shared/components/page-header";

export default async function AppointmentsPage() {
  const appointments = await getAppointments();

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
