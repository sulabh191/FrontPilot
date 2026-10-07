import "server-only";
import { unwrap } from "@frontpilot/api-client";
import { getApi } from "@/shared/lib/api";
import { formatDateParts, formatRelativeTime } from "@/shared/lib/format";
import type { OverviewData } from "../types";

// Everything the Overview page needs, in one API call. The API computes the
// numbers (last 7 days); this file only turns them into what the UI shows.
export async function getOverview(): Promise<OverviewData> {
  const { stats, needsAttention, upcomingAppointments, timeZone } = unwrap(
    await getApi().GET("/v1/overview"),
  );

  return {
    stats: [
      { label: "Conversations", value: String(stats.conversations), trend: "Last 7 days" },
      { label: "New leads", value: String(stats.newLeads), trend: "Last 7 days" },
      { label: "Appointments booked", value: String(stats.appointmentsBooked), trend: "Last 7 days" },
      // The API sends a 0–1 rate; percentages are a display decision.
      { label: "Handled by AI", value: `${Math.round(stats.aiResolutionRate * 100)}%`, trend: "No human needed" },
    ],
    needsAttention: needsAttention.map((c) => ({
      id: c.conversationId,
      customer: c.customerName ?? "Website visitor",
      message: c.lastCustomerMessage ?? "",
      reason: c.summary ?? "Waiting for your reply",
      receivedAt: formatRelativeTime(new Date(c.updatedAt)),
    })),
    upcoming: upcomingAppointments.map((a) => {
      // Shown on the business's clock, not the server's.
      const { date, time } = formatDateParts(new Date(a.startsAt), timeZone);
      return {
        id: a.id,
        customer: a.customerName,
        service: a.service,
        when: `${date} · ${time}`,
        status: a.status === "confirmed" ? ("Confirmed" as const) : ("Awaiting approval" as const),
      };
    }),
  };
}
