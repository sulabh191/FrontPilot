import type { z } from "zod";
import type { tenantSchema } from "./tenants.schemas";

// The authenticated business, attached to the request by the auth guard.
export type Tenant = z.infer<typeof tenantSchema>;
