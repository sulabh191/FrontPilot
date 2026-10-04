// Loads the demo business and sample data into the database.
// Safe to run many times: it deletes the demo tenant first, and every
// other row goes with it (cascading deletes), then inserts fresh data.
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

try {
  process.loadEnvFile("../../apps/web/.env.local");
} catch {
  // rely on the environment
}

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const sql = postgres(url, { max: 1 });
const db = drizzle(sql, { schema });
const { tenants, agentSettings, conversations, messages, leads, appointments } = schema;

const TENANT_ID = "tenant_rapid_plumbing";

const at = (daysFromNow: number, hour: number, minute = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, minute, 0, 0);
  return date;
};
const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000);

async function seed() {
  await db.transaction(async (tx) => {
    await tx.delete(tenants).where(eq(tenants.id, TENANT_ID));

    await tx.insert(tenants).values({ id: TENANT_ID, name: "Rapid Plumbing", slug: "rapid-plumbing" });

    await tx.insert(agentSettings).values({
      tenantId: TENANT_ID,
      agentName: "Rapid Plumbing Assistant",
      greeting: "Hi! I'm the Rapid Plumbing assistant. How can I help with your plumbing today?",
      tone: "friendly",
      instructions:
        "Never quote prices for jobs not on the price list; offer a free estimate instead.\nFor gas smells or flooding, tell the customer to call our emergency line right away.",
      tools: { answerQuestions: true, qualifyLeads: true, bookAppointments: true, followUps: false },
      approvalMode: "review",
      suggestedQuestions: ["Book a visit", "How much does it cost?", "I have an emergency", "What are your hours?"],
    });

    // Conversations, each with its messages.
    const sampleChats = [
      {
        customerName: "Priya Shah",
        status: "needs_owner" as const,
        summary: "Leaking kitchen sink; booking for tomorrow 2:30 PM awaits approval",
        updatedAt: minutesAgo(10),
        chat: [
          ["user", "My kitchen sink is leaking. Can someone come tomorrow?"],
          ["assistant", "Yes, we can fix that! Leak repair starts from $149. Is it leaking now or just dripping?"],
          ["user", "Under the sink, steady drip. 2:30 works for me."],
          ["assistant", "Thanks Priya! I've requested 2:30 PM tomorrow. The team will confirm shortly."],
        ],
      },
      {
        customerName: null,
        status: "resolved_by_ai" as const,
        summary: "Asked about weekend hours; answered",
        updatedAt: minutesAgo(32),
        chat: [
          ["user", "Do you work weekends?"],
          ["assistant", "We're open Saturday 8 AM–4 PM, and Sunday for emergencies only."],
        ],
      },
      {
        customerName: "Mark Chen",
        status: "needs_owner" as const,
        summary: "Wants a custom quote for a tankless water heater",
        updatedAt: minutesAgo(65),
        chat: [
          ["user", "Can you give me a quote for a tankless water heater?"],
          ["assistant", "Water heater installs start from $1,450. For tankless, the team will give you an exact quote. Can I take your number?"],
        ],
      },
      {
        customerName: "Alex Kim",
        status: "resolved_by_ai" as const,
        summary: "Burst pipe; booked for tomorrow 9:00 AM",
        updatedAt: minutesAgo(60 * 20),
        chat: [
          ["user", "A pipe burst in my basement!"],
          ["assistant", "Please call our 24/7 emergency line at (555) 010-9111 right away. Have you shut off the main water valve?"],
          ["user", "Yes, it's off now. Can someone come first thing tomorrow?"],
          ["assistant", "You're booked for 9:00 AM tomorrow. See you then!"],
        ],
      },
    ];

    const conversationIds: Record<string, string> = {};
    for (const c of sampleChats) {
      const [row] = await tx
        .insert(conversations)
        .values({
          tenantId: TENANT_ID,
          customerName: c.customerName,
          status: c.status,
          summary: c.summary,
          createdAt: c.updatedAt,
          updatedAt: c.updatedAt,
        })
        .returning({ id: conversations.id });
      if (!row) throw new Error("conversation insert failed");
      if (c.customerName) conversationIds[c.customerName] = row.id;

      await tx.insert(messages).values(
        c.chat.map(([role, content], i) => ({
          conversationId: row.id,
          tenantId: TENANT_ID,
          role: role as "user" | "assistant",
          content: content!,
          createdAt: new Date(c.updatedAt.getTime() - (c.chat.length - i) * 30_000),
        })),
      );
    }

    // Leads across every pipeline stage.
    const leadRows = await tx
      .insert(leads)
      .values([
        { tenantId: TENANT_ID, conversationId: conversationIds["Priya Shah"], name: "Priya Shah", phone: "(555) 014-2201", service: "Leaking sink", score: "hot", stage: "new", estimatedValue: 180 },
        { tenantId: TENANT_ID, conversationId: conversationIds["Mark Chen"], name: "Mark Chen", service: "Tankless water heater", score: "warm", stage: "new", estimatedValue: 3200 },
        { tenantId: TENANT_ID, name: "Nina Brooks", service: "Low water pressure", score: "cold", stage: "new", estimatedValue: 150, source: "email" },
        { tenantId: TENANT_ID, name: "Dana Lopez", service: "Drain cleaning", score: "hot", stage: "qualified", estimatedValue: 240 },
        { tenantId: TENANT_ID, name: "Sam Patel", service: "Bathroom remodel quote", score: "warm", stage: "qualified", estimatedValue: 8500 },
        { tenantId: TENANT_ID, conversationId: conversationIds["Alex Kim"], name: "Alex Kim", service: "Burst pipe repair", score: "hot", stage: "booked", estimatedValue: 450 },
        { tenantId: TENANT_ID, name: "Jordan Lee", service: "Toilet repair", score: "cold", stage: "booked", estimatedValue: 200, source: "sms" },
        { tenantId: TENANT_ID, name: "Rita Gomez", service: "Sump pump install", score: "warm", stage: "won", estimatedValue: 1250, source: "email" },
      ])
      .returning({ id: leads.id, name: leads.name });
    const leadId = (name: string) => leadRows.find((l) => l.name === name)?.id;

    await tx.insert(appointments).values([
      { tenantId: TENANT_ID, leadId: leadId("Alex Kim"), customerName: "Alex Kim", service: "Burst pipe repair", address: "14 Elm St", startsAt: at(1, 9), status: "confirmed" },
      { tenantId: TENANT_ID, leadId: leadId("Priya Shah"), customerName: "Priya Shah", service: "Leaking sink", address: "88 Lake Ave", startsAt: at(1, 14, 30), status: "awaiting_approval" },
      { tenantId: TENANT_ID, leadId: leadId("Jordan Lee"), customerName: "Jordan Lee", service: "Toilet repair", address: "3 Birch Rd", startsAt: at(2, 11), status: "confirmed" },
      { tenantId: TENANT_ID, leadId: leadId("Sam Patel"), customerName: "Sam Patel", service: "Bathroom remodel estimate", address: "52 Oak Ln", startsAt: at(3, 10), status: "confirmed", bookedBy: "staff" },
      { tenantId: TENANT_ID, leadId: leadId("Dana Lopez"), customerName: "Dana Lopez", service: "Drain cleaning", address: "7 Pine Ct", startsAt: at(3, 16), status: "cancelled" },
    ]);
  });
}

try {
  await seed();
  console.log("✓ Seeded demo tenant 'rapid-plumbing'");
} finally {
  await sql.end();
}
