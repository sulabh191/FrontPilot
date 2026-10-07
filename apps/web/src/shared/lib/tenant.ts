import "server-only";
import { cache } from "react";
import { unwrap } from "@frontpilot/api-client";
import { eq, getDb, tenants } from "@frontpilot/db";
import { getApi } from "./api";

export type Tenant = {
  id: string;
  name: string;
  slug: string; // short public name used in URLs, e.g. /chat/rapid-plumbing
  timeZone: string; // IANA name, e.g. "America/New_York"
};

// The business whose dashboard is being viewed: whoever the API token belongs to.
// When real login arrives, the token comes from the signed-in user's session
// and no caller changes.
// cache() runs this once per request, so the layout and the page share one API call.
export const getCurrentTenant = cache(async (): Promise<Tenant> => {
  return unwrap(await getApi().GET("/v1/me"));
});

// Public lookup used by the chat widget, where there is no signed-in user.
// Still reads the database directly; it moves to GET /v1/widget/:slug in F3.
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const [row] = await getDb()
    .select({ id: tenants.id, name: tenants.name, slug: tenants.slug, timeZone: tenants.timeZone })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);
  return row ?? null;
}
