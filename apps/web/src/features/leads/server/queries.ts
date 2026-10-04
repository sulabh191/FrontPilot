import type { Lead } from "../types";
import { mockLeads } from "./mock-data";

// All leads for one business. Only the body changes when the database is added.
export async function getLeads(tenantId: string): Promise<Lead[]> {
  void tenantId;
  return mockLeads;
}
