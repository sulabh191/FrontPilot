import "server-only";
import { rapidPlumbing } from "@/features/demo-site";

// TEMPORARY: business facts for the agent, written straight into the prompt.
// Step 12 replaces this with a real knowledge base (documents → chunks → Qdrant search).
export async function getBusinessTimeZone(tenantId: string): Promise<string> {
  return tenantId === "tenant_rapid_plumbing" ? rapidPlumbing.timeZone : "America/New_York";
}

export async function getBusinessFacts(tenantId: string): Promise<string> {
  if (tenantId !== "tenant_rapid_plumbing") return "No business information available.";

  const b = rapidPlumbing;
  return [
    `Business: ${b.name}. ${b.tagline}`,
    `Main phone: ${b.phone}. 24/7 emergency line: ${b.emergencyPhone}.`,
    `Service area: ${b.serviceArea}.`,
    `Hours: ${b.hours.map((h) => `${h.days} ${h.time}`).join("; ")}.`,
    `Services and starting prices:`,
    ...b.services.map((s) => `- ${s.name}: ${s.price}. ${s.description}`),
    `Guarantees: ${b.promises.join("; ")}.`,
  ].join("\n");
}
