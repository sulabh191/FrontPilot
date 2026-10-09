import { z } from "zod";

// The authenticated business, as returned by GET /v1/me.
// One schema → the TypeScript type, the API docs and the generated client type.
export const tenantSchema = z.object({
  id: z.string(), // text id, e.g. "tenant_rapid_plumbing"
  name: z.string(),
  slug: z.string(), // short public name used in URLs, e.g. /demo/rapid-plumbing
  timeZone: z.string(), // IANA name, e.g. "America/New_York"
});
