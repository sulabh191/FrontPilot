export type Stat = {
  label: string;
  value: string;
  trend: string;
};

export type AttentionItem = {
  id: string;
  customer: string;
  message: string;
  reason: string;
  receivedAt: string;
};

export type UpcomingAppointment = {
  id: string;
  customer: string;
  service: string;
  when: string;
  status: "Confirmed" | "Awaiting approval";
};

export type OverviewData = {
  stats: Stat[];
  needsAttention: AttentionItem[];
  upcoming: UpcomingAppointment[];
};
