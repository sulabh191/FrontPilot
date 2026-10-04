import "server-only";
import { eq, getDb, tenants } from "@frontpilot/db";

export type Tenant = {
  id: string;
  name: string;
  slug: string; // short public name used in URLs, e.g. /chat/rapid-plumbing
};

// Until login exists, the dashboard always shows the demo business.
const DEMO_TENANT_SLUG = "rapid-plumbing";

// The business whose dashboard is being viewed.
// When login is added, this reads the signed-in user's organization instead,
// and no caller changes.
export async function getCurrentTenant(): Promise<Tenant> {
  const tenant = await getTenantBySlug(DEMO_TENANT_SLUG);
  if (!tenant) {
    throw new Error(`Demo tenant "${DEMO_TENANT_SLUG}" not found. Run: pnpm db:seed`);
  }
  return tenant;
}

// Public lookup used by the chat widget, where there is no signed-in user.
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const [row] = await getDb()
    .select({ id: tenants.id, name: tenants.name, slug: tenants.slug })
    .from(tenants)
    .where(eq(tenants.slug, slug))
    .limit(1);
  return row ?? null;
}
