import "server-only";
import {
  and,
  appointments,
  asc,
  conversations,
  count,
  desc,
  eq,
  getDb,
  gte,
  leads,
  messages,
  ne,
} from "@frontpilot/db";
import { formatDateParts, formatRelativeTime } from "@/shared/lib/format";
import type { OverviewData } from "../types";

// Everything the Overview page needs, computed from live data.
export async function getOverview(tenantId: string): Promise<OverviewData> {
  const db = getDb();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const now = new Date();

  // Independent queries run in parallel.
  const [convoStats, newLeads, booked, attention, upcoming] = await Promise.all([
    db
      .select({ status: conversations.status, total: count() })
      .from(conversations)
      .where(and(eq(conversations.tenantId, tenantId), gte(conversations.createdAt, weekAgo)))
      .groupBy(conversations.status),
    db
      .select({ total: count() })
      .from(leads)
      .where(and(eq(leads.tenantId, tenantId), gte(leads.createdAt, weekAgo))),
    db
      .select({ total: count() })
      .from(appointments)
      .where(
        and(
          eq(appointments.tenantId, tenantId),
          gte(appointments.createdAt, weekAgo),
          ne(appointments.status, "cancelled"),
        ),
      ),
    db
      .select()
      .from(conversations)
      .where(and(eq(conversations.tenantId, tenantId), eq(conversations.status, "needs_owner")))
      .orderBy(desc(conversations.updatedAt))
      .limit(5),
    db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.tenantId, tenantId),
          gte(appointments.startsAt, now),
          ne(appointments.status, "cancelled"),
        ),
      )
      .orderBy(asc(appointments.startsAt))
      .limit(4),
  ]);

  const totalConversations = convoStats.reduce((sum, row) => sum + row.total, 0);
  const resolvedByAi = convoStats.find((row) => row.status === "resolved_by_ai")?.total ?? 0;
  const aiShare = totalConversations ? Math.round((resolvedByAi / totalConversations) * 100) : 0;

  // Latest customer message for each conversation needing attention.
  const needsAttention = await Promise.all(
    attention.map(async (c) => {
      const [last] = await db
        .select({ content: messages.content })
        .from(messages)
        .where(and(eq(messages.conversationId, c.id), eq(messages.role, "user")))
        .orderBy(desc(messages.createdAt))
        .limit(1);
      return {
        id: c.id,
        customer: c.customerName ?? "Website visitor",
        message: last?.content ?? "",
        reason: c.summary ?? "Waiting for your reply",
        receivedAt: formatRelativeTime(c.updatedAt),
      };
    }),
  );

  return {
    stats: [
      { label: "Conversations", value: String(totalConversations), trend: "Last 7 days" },
      { label: "New leads", value: String(newLeads[0]?.total ?? 0), trend: "Last 7 days" },
      { label: "Appointments booked", value: String(booked[0]?.total ?? 0), trend: "Last 7 days" },
      { label: "Handled by AI", value: `${aiShare}%`, trend: "No human needed" },
    ],
    needsAttention,
    upcoming: upcoming.map((a) => {
      const { date, time } = formatDateParts(a.startsAt);
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
