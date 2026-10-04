import type { OverviewData } from "../types";
import { NeedsAttention } from "./needs-attention";
import { StatCards } from "./stat-cards";
import { UpcomingAppointments } from "./upcoming-appointments";

export function OverviewDashboard({ data }: { data: OverviewData }) {
  return (
    <div className="space-y-6">
      <StatCards stats={data.stats} />
      <div className="grid gap-6 lg:grid-cols-2">
        <NeedsAttention items={data.needsAttention} />
        <UpcomingAppointments appointments={data.upcoming} />
      </div>
    </div>
  );
}
