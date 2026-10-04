// Public API of @frontpilot/db.
export { getDb, type Database } from "./client";
export * from "./schema";

import type { agentSettings, appointments, conversations, leads, messages, tenants } from "./schema";

// Row types, inferred from the tables, for use across the app.
export type TenantRow = typeof tenants.$inferSelect;
export type AgentSettingsRow = typeof agentSettings.$inferSelect;
export type ConversationRow = typeof conversations.$inferSelect;
export type MessageRow = typeof messages.$inferSelect;
export type LeadRow = typeof leads.$inferSelect;
export type AppointmentRow = typeof appointments.$inferSelect;

// Query helpers re-exported so apps don't depend on drizzle-orm directly.
export { and, asc, count, desc, eq, gte, inArray, ne, sql } from "drizzle-orm";
