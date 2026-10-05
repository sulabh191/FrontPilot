import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// ---------- shared column helpers ----------
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

// ---------- enums (Postgres checks these values for us) ----------
export const toneEnum = pgEnum("tone", ["friendly", "professional", "casual"]);
export const approvalModeEnum = pgEnum("approval_mode", ["review", "auto"]);
export const channelEnum = pgEnum("channel", ["website_chat", "email", "sms"]);
export const conversationStatusEnum = pgEnum("conversation_status", [
  "open", // active chat, nothing needed from the owner yet
  "needs_owner", // waiting on the owner (approval, custom quote, follow-up)
  "resolved_by_ai", // finished without a human
  "resolved_by_owner", // finished after the owner stepped in
]);
export const messageRoleEnum = pgEnum("message_role", ["user", "assistant"]);
export const leadStageEnum = pgEnum("lead_stage", ["new", "qualified", "booked", "won", "lost"]);
export const leadScoreEnum = pgEnum("lead_score", ["hot", "warm", "cold"]);
export const appointmentStatusEnum = pgEnum("appointment_status", [
  "confirmed",
  "awaiting_approval",
  "cancelled",
]);
export const bookedByEnum = pgEnum("booked_by", ["ai_agent", "staff"]);

// ---------- tables ----------

// Weekly opening hours in the business's local time. null = closed that day.
export type Weekday = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";
export type OpeningHours = Record<Weekday, { open: string; close: string } | null>; // "07:00"

// One row per business using FrontPilot.
export const tenants = pgTable("tenants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  timeZone: text("time_zone").notNull().default("America/New_York"),
  openingHours: jsonb("opening_hours").$type<OpeningHours>(),
  appointmentMinutes: integer("appointment_minutes").notNull().default(60),
  createdAt: createdAt(),
});

export type AgentTools = {
  answerQuestions: boolean;
  qualifyLeads: boolean;
  bookAppointments: boolean;
  followUps: boolean;
};

// One row per business: everything configured on the Agent setup page.
export const agentSettings = pgTable("agent_settings", {
  tenantId: text("tenant_id")
    .primaryKey()
    .references(() => tenants.id, { onDelete: "cascade" }),
  agentName: text("agent_name").notNull(),
  greeting: text("greeting").notNull(),
  tone: toneEnum("tone").notNull().default("friendly"),
  instructions: text("instructions").notNull().default(""),
  tools: jsonb("tools").$type<AgentTools>().notNull(),
  approvalMode: approvalModeEnum("approval_mode").notNull().default("review"),
  suggestedQuestions: jsonb("suggested_questions").$type<string[]>().notNull().default([]),
  updatedAt: updatedAt(),
});

// A chat thread between one customer and a business's agent.
export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    channel: channelEnum("channel").notNull().default("website_chat"),
    customerName: text("customer_name"),
    status: conversationStatusEnum("status").notNull().default("open"),
    summary: text("summary"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  // Dashboard lists a tenant's conversations, newest first.
  (t) => [index("conversations_tenant_updated_idx").on(t.tenantId, t.updatedAt)],
);

// Every message in a conversation, plus token usage for cost tracking.
export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    role: messageRoleEnum("role").notNull(),
    content: text("content").notNull(),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    createdAt: createdAt(),
  },
  (t) => [index("messages_conversation_idx").on(t.conversationId, t.createdAt)],
);

// The CRM: potential jobs, moving through pipeline stages.
export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id").references(() => conversations.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    phone: text("phone"),
    service: text("service").notNull(),
    score: leadScoreEnum("score").notNull().default("warm"),
    stage: leadStageEnum("stage").notNull().default("new"),
    estimatedValue: integer("estimated_value"), // whole dollars
    source: channelEnum("source").notNull().default("website_chat"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("leads_tenant_stage_idx").on(t.tenantId, t.stage)],
);

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    leadId: uuid("lead_id").references(() => leads.id, { onDelete: "set null" }),
    customerName: text("customer_name").notNull(),
    service: text("service").notNull(),
    address: text("address"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    status: appointmentStatusEnum("status").notNull().default("awaiting_approval"),
    bookedBy: bookedByEnum("booked_by").notNull().default("ai_agent"),
    reminderSent: boolean("reminder_sent").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index("appointments_tenant_starts_idx").on(t.tenantId, t.startsAt)],
);
