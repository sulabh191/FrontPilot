export type Tenant = {
  id: string;
  name: string;
  slug: string; // short public name used in URLs, e.g. /chat/rapid-plumbing
};

// Temporary tenant list until the database step.
const tenants: Tenant[] = [
  { id: "tenant_rapid_plumbing", name: "Rapid Plumbing", slug: "rapid-plumbing" },
];

const demoTenant = tenants[0]!;

// The business whose dashboard is being viewed.
// For now every visitor sees the demo business. When login is added,
// this reads the signed-in user's organization instead, and no caller changes.
export async function getCurrentTenant(): Promise<Tenant> {
  return demoTenant;
}

// Public lookup used by the chat widget, where there is no signed-in user:
// the business is identified by the slug in the page or script tag.
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  return tenants.find((tenant) => tenant.slug === slug) ?? null;
}
