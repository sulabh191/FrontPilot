import { Injectable } from "@nestjs/common";
import type { Tenant } from "../tenants/tenant.types";
import { OverviewRepository } from "./overview.repository";

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class OverviewService {
  constructor(private readonly repo: OverviewRepository) {}

  async get(tenant: Tenant) {
    const now = new Date();
    const since = new Date(now.getTime() - 7 * DAY_MS);

    // Independent queries run in parallel: total time ≈ the slowest one.
    const [counts, newLeads, booked, attention, upcoming] = await Promise.all([
      this.repo.conversationCountsByStatus(tenant.id, since),
      this.repo.newLeadCount(tenant.id, since),
      this.repo.bookedCount(tenant.id, since),
      this.repo.needsOwner(tenant.id, 5),
      this.repo.upcoming(tenant.id, now, 5),
    ]);

    const total = counts.reduce((sum, row) => sum + row.total, 0);
    const resolvedByAi = counts.find((row) => row.status === "resolved_by_ai")?.total ?? 0;
    const customerMessages = await this.repo.customerMessages(attention.map((c) => c.id));

    return {
      period: { from: since.toISOString(), to: now.toISOString() },
      stats: {
        conversations: total,
        resolvedByAi,
        aiResolutionRate: total ? resolvedByAi / total : 0,
        newLeads,
        appointmentsBooked: booked,
      },
      needsAttention: attention.map((c) => ({
        conversationId: c.id,
        customerName: c.customerName,
        lastCustomerMessage:
          customerMessages.filter((m) => m.conversationId === c.id).at(-1)?.content ?? null,
        summary: c.summary,
        updatedAt: c.updatedAt.toISOString(),
      })),
      upcomingAppointments: upcoming.map((a) => ({
        id: a.id,
        customerName: a.customerName,
        service: a.service,
        startsAt: a.startsAt.toISOString(),
        status: a.status as "awaiting_approval" | "confirmed",
      })),
      timeZone: tenant.timeZone,
    };
  }
}
