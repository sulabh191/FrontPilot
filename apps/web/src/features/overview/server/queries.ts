import type { OverviewData } from "../types";
import { mockOverview } from "./mock-data";

// Data access for the Overview page. Takes the tenant explicitly, so every
// query is scoped to one business. Today it returns sample data; when the
// database is added, only the body of this function changes.
export async function getOverview(tenantId: string): Promise<OverviewData> {
  void tenantId;
  return mockOverview;
}
