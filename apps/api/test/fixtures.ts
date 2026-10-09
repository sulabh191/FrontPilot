import {
  agentSettings,
  appointments,
  conversations,
  type Database,
  inArray,
  leads,
  messages,
  type OpeningHours,
  tenants,
} from "@frontpilot/db";
import { addDays, dateInZone, zonedTimeToUtc } from "../src/common/time/time-zone";

// Known data for the e2e tests: two businesses, so every test can check that
// business A can never see or change business B's data.

export const NY = "America/New_York";
export const A = { id: "tenant_e2e_a", slug: "e2e-plumbing", name: "E2E Plumbing" };
export const B = { id: "tenant_e2e_b", slug: "e2e-other", name: "Other Business" };

// Open every day, so tests never depend on which weekday they run.
const day = { open: "07:00", close: "19:00" };
const openingHours: OpeningHours = { sun: day, mon: day, tue: day, wed: day, thu: day, fri: day, sat: day };

// "N days from today at HH:MM", in New York, as the UTC instant the database stores.
export const daysAhead = (days: number) => addDays(dateInZone(new Date(), NY), days);
export const nyTime = (days: number, hhmm: string) => zonedTimeToUtc(daysAhead(days), hhmm, NY);

export const INTERNAL_INSTRUCTIONS = "INTERNAL: never offer discounts";

export type Fixtures = Awaited<ReturnType<typeof resetFixtures>>;

// Deletes both test businesses (everything else cascades) and inserts fresh data.
export async function resetFixtures(db: Database) {
  await db.delete(tenants).where(inArray(tenants.id, [A.id, B.id]));

  await db.insert(tenants).values([
    { ...A, timeZone: NY, openingHours, appointmentMinutes: 60 },
    { ...B, timeZone: NY, openingHours, appointmentMinutes: 60 },
  ]);
  await db.insert(agentSettings).values({
    tenantId: A.id,
    agentName: "Max",
    greeting: "Hi! How can I help?",
    tone: "friendly",
    instructions: INTERNAL_INSTRUCTIONS,
    tools: { answerQuestions: true, qualifyLeads: true, bookAppointments: true, followUps: false },
    approvalMode: "review",
    suggestedQuestions: ["Book a visit", "Prices"],
  });

  // Business A: three bookings awaiting approval (each with its own lead and chat) + one confirmed.
  const pendingFor = async (customer: string, service: string, days: number) => {
    const [conversation] = await db
      .insert(conversations)
      .values({ tenantId: A.id, customerName: customer, status: "needs_owner", summary: `${service}; awaiting approval` })
      .returning();
    await db.insert(messages).values([
      { tenantId: A.id, conversationId: conversation!.id, role: "user", content: `I need help with ${service}` },
      { tenantId: A.id, conversationId: conversation!.id, role: "assistant", content: "Booked, pending approval." },
    ]);
    const [lead] = await db
      .insert(leads)
      .values({
        tenantId: A.id,
        conversationId: conversation!.id,
        name: customer,
        phone: "(413) 555-0123",
        smsConsent: true,
        service,
        stage: "booked",
        score: "hot",
      })
      .returning();
    const [appointment] = await db
      .insert(appointments)
      .values({
        tenantId: A.id,
        leadId: lead!.id,
        customerName: customer,
        service,
        address: "1 Main St",
        startsAt: nyTime(days, "10:00"),
        status: "awaiting_approval",
      })
      .returning();
    return { conversationId: conversation!.id, leadId: lead!.id, appointmentId: appointment!.id };
  };

  const approveMe = await pendingFor("Priya Shah", "Leaking sink", 2);
  const declineMe = await pendingFor("Mark Chen", "Water heater", 3);
  const raceMe = await pendingFor("Nina Brooks", "Low pressure", 5);

  const [confirmed] = await db
    .insert(appointments)
    .values({
      tenantId: A.id,
      customerName: "Sam Patel",
      service: "Drain cleaning",
      startsAt: nyTime(4, "11:00"),
      status: "confirmed",
      bookedBy: "staff",
    })
    .returning();

  // Business B: its own chat, lead and pending booking. A must never reach these.
  const [otherConversation] = await db.insert(conversations).values({ tenantId: B.id, status: "needs_owner" }).returning();
  const [otherLead] = await db
    .insert(leads)
    .values({ tenantId: B.id, conversationId: otherConversation!.id, name: "Bob Other", service: "Roof repair" })
    .returning();
  const [otherAppointment] = await db
    .insert(appointments)
    .values({
      tenantId: B.id,
      leadId: otherLead!.id,
      customerName: "Bob Other",
      service: "Roof repair",
      startsAt: nyTime(2, "10:00"),
      status: "awaiting_approval",
    })
    .returning();

  return {
    approveMe,
    declineMe,
    raceMe,
    confirmedAppointmentId: confirmed!.id,
    other: { conversationId: otherConversation!.id, leadId: otherLead!.id, appointmentId: otherAppointment!.id },
  };
}
