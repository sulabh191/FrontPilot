export type Tenant = {
  id: string;
  name: string;
};

// The business whose dashboard is being viewed.
// For now every visitor sees the demo business. When login is added,
// this reads the signed-in user's organization instead, and no caller changes.
export async function getCurrentTenant(): Promise<Tenant> {
  return { id: "tenant_rapid_plumbing", name: "Rapid Plumbing" };
}
