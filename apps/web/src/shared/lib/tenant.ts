export type Tenant = {
  id: string;
  name: string;
  slug: string; // short public name used in URLs, e.g. /chat/rapid-plumbing
};

// The business whose dashboard is being viewed.
// For now every visitor sees the demo business. When login is added,
// this reads the signed-in user's organization instead, and no caller changes.
export async function getCurrentTenant(): Promise<Tenant> {
  return { id: "tenant_rapid_plumbing", name: "Rapid Plumbing", slug: "rapid-plumbing" };
}
